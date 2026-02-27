"""

Adaptive difficulty layer to use  BKT mastery scores to:
1. Challenge difficulty selection (easy up / hard down based on accuracy)
2. Hint delivery (progressive 3-tier hints based on session performance)
3. Weak-topic detection and next-challenge routing
"""

from __future__ import annotations
import json
from dataclasses import dataclass, asdict
from typing import Optional
from sqlalchemy.orm import Session

from models import MasteryState, Competency, Challenge, GameSession, SimStateEnum
from services.progress_service import get_user_mastery_map, MASTERY_THRESHOLD


#Difficulty configurations

ACCURACY_THRESHOLDS = {
    "too_easy":  0.85,   # accuracy > 85% → step difficulty up
    "target":    0.70,   # 60-85% → stay at current difficulty
    "too_hard":  0.50,   # accuracy < 50% → step difficulty down
}

DIFFICULTY_BOUNDS = (1, 5)   # clamp to [1, 5]


#Hints 

@dataclass
class HintPayload:
    level: int                     # 1 = gentle nudge, 2 = concept reminder, 3 = explicit solution
    message: str
    concept_reference: Optional[str] = None
    visual_cue: Optional[str] = None   # e.g. "highlight_free_frames"

#hint triggers 
HINT_TRIGGER_STEPS = {
    1: 2,    # after 2 failed steps → hint level 1
    2: 4,    # after 4 failed steps → hint level 2
    3: 7,    # after 7 failed steps → full solution hint
}

# Per-challenge hint content (extends what's in Challenge.hint column)
CHALLENGE_HINTS: dict[str, list[HintPayload]] = {
    "os_mem_01": [
        HintPayload(
            level=1,
            message="Look at the Goal panel — it shows the exact fragmentation target. Try allocating a large block first.",
            visual_cue="highlight_fragmentation_meter",
        ),
        HintPayload(
            level=2,
            message="Memory fragmentation increases when you allocate many small blocks then free them. "
                    "Try: alloc 256 → alloc 128 → free 256 and watch what happens.",
            concept_reference="External Fragmentation",
        ),
        HintPayload(
            level=3,
            message="Command sequence to reach goal: `alloc 512`, `alloc 256`, `free 0`, `alloc 128`. "
                    "This creates non-contiguous free holes, raising fragmentation.",
            concept_reference="Memory Allocation Strategies",
            visual_cue="step_by_step_overlay",
        ),
    ],
    "os_page_01": [
        HintPayload(level=1, message="Fill all 4 frame slots before triggering a page fault. Start with: `load 1`, `load 2`, `load 3`, `load 4`."),
        HintPayload(level=2, message="LRU evicts the page used LEAST recently. Keep a mental list of access order.", concept_reference="LRU Page Replacement"),
        HintPayload(level=3, message="Complete sequence: load 1 2 3 4, then `load 1` (hit), `load 5` (fault, evicts 2 via LRU).", concept_reference="LRU Algorithm"),
    ],
    "dbms_btree_01": [
        HintPayload(level=1, message="Insert values that will cause the root to split. Try inserting 3 keys larger than the existing root key."),
        HintPayload(level=2, message="A node splits when it has more than 2 keys (order-3 tree). The median key promotes to the parent.", concept_reference="B+ Tree Node Split"),
        HintPayload(level=3, message="Insert: 10, 20, 30. After inserting 30 into [10,20], the node overflows. 20 promotes as new root.", visual_cue="split_animation_trigger"),
    ],
}


#Adaptive Engine

class AdaptiveEngine:
   #Adding adaptive difficulty to the game engine

    def get_target_difficulty(
        self,
        user_id: int,
        competency_slug: str,
        db: Session,
    ) -> int:
        #returns the recommended difficulty level for the next challenge based on user's mastery 
        mastery_map = get_user_mastery_map(db, user_id)
        p = mastery_map.get(competency_slug, 0.3)

        # Base difficulty from mastery
        if p < 0.35:
            base = 1
        elif p < 0.55:
            base = 2
        elif p < 0.70:
            base = 3
        elif p < 0.85:
            base = 4
        else:
            base = 5

        # Adjust using recent session accuracy
        recent_accuracy = self._get_recent_accuracy(db, user_id, competency_slug)
        if recent_accuracy is not None:
            if recent_accuracy > ACCURACY_THRESHOLDS["too_easy"]:
                base = min(base + 1, DIFFICULTY_BOUNDS[1])
            elif recent_accuracy < ACCURACY_THRESHOLDS["too_hard"]:
                base = max(base - 1, DIFFICULTY_BOUNDS[0])

        return base

    def get_hint(
        self,
        challenge_slug: str,
        steps_since_last_success: int,
        session_accuracy: float,
        current_hint_level: int = 0,
    ) -> Optional[HintPayload]:
    
        # Determine which hint level should be active
        due_level = 0
        for level, trigger in sorted(HINT_TRIGGER_STEPS.items()):
            if steps_since_last_success >= trigger:
                due_level = level

        # Also escalate hints if accuracy is very low
        if session_accuracy < 0.40 and due_level < 2:
            due_level = max(due_level, 2)

        if due_level <= current_hint_level:
            return None   # no new hint due

        hints = CHALLENGE_HINTS.get(challenge_slug)
        if not hints:
            # Fall back to generic hints
            return self._generic_hint(due_level)

        for h in hints:
            if h.level == due_level:
                return h

        return None

    def should_show_visualization_challenge(
        self,
        user_id: int,
        competency_slug: str,
        db: Session,
    ) -> bool:
        
        recent_accuracy = self._get_recent_accuracy(db, user_id, competency_slug)
        if recent_accuracy is None:
            return False
        return recent_accuracy < 0.60

    def get_next_challenge_type(
        self,
        user_id: int,
        competency_slug: str,
        db: Session,
    ) -> str:
       #to return a challenge type recommendation 
        mastery_map = get_user_mastery_map(db, user_id)
        p = mastery_map.get(competency_slug, 0.3)
        accuracy = self._get_recent_accuracy(db, user_id, competency_slug)

        if p < 0.40:
            return "mcq"          # Start with concept questions
        if accuracy is not None and accuracy < 0.50:
            return "visual"       # Struggling → show visualization
        if p < 0.70:
            return "simulator"    # Mid mastery → hands-on sim
        return "debug"            # High mastery → debug challenges

    def get_session_weak_spots(
        self,
        event_log: list[dict],
    ) -> dict:
       #to analyze a completed session's event log and flag weak spots
        if not event_log:
            return {}

        total = len(event_log)
        successes = sum(1 for e in event_log if e.get("success"))
        accuracy = successes / total if total else 0

        failed_actions = {}
        for entry in event_log:
            if not entry.get("success"):
                action = entry.get("action", "unknown")
                failed_actions[action] = failed_actions.get(action, 0) + 1

        most_failed = max(failed_actions, key=failed_actions.get) if failed_actions else None

        return {
            "accuracy": round(accuracy, 3),
            "total_steps": total,
            "failure_rate": round(1 - accuracy, 3),
            "most_failed_action": most_failed,
            "stuck": accuracy < 0.30 and total > 5,
        }

    #helping functions

    def _get_recent_accuracy(
        self,
        db: Session,
        user_id: int,
        competency_slug: str,
        window: int = 3,
    ) -> Optional[float]:
       #returns accuracy of user's last window session on this competency
        comp = db.query(Competency).filter_by(slug=competency_slug).first()
        if not comp:
            return None

        recent_sessions = (
            db.query(GameSession)
            .join(Challenge, GameSession.challenge_id == Challenge.id)
            .filter(
                GameSession.user_id == user_id,
                Challenge.competency_id == comp.id,
                GameSession.status == SimStateEnum.COMPLETED,
            )
            .order_by(GameSession.ended_at.desc())
            .limit(window)
            .all()
        )

        if not recent_sessions:
            return None

        total_steps = 0
        total_correct = 0
        for sess in recent_sessions:
            log = sess.event_log or []
            total_steps += len(log)
            total_correct += sum(1 for e in log if e.get("success"))

        return total_correct / total_steps if total_steps else None

    def _generic_hint(self, level: int) -> HintPayload:
        generic = {
            1: HintPayload(level=1, message="Check the Goal panel — what specific condition needs to be true?"),
            2: HintPayload(level=2, message="Try using the `help` command to see available actions and their syntax.", concept_reference="Terminal Commands"),
            3: HintPayload(level=3, message="Read the challenge narrative carefully — it describes exactly what the simulator needs you to do.", concept_reference="Challenge Objective"),
        }
        return generic.get(level, generic[1])

#for importing
adaptive_engine = AdaptiveEngine()