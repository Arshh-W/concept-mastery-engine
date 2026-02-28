"""
Feedback Service — Gemini 2.5 Flash powered step feedback and deterministic goal evaluation.
Triggers automatically when the player makes 2-3 failed actions in a row.
"""

import os
import json
from typing import Optional
import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=_api_key)

_model = genai.GenerativeModel(
    "gemini-2.5-flash",
    system_instruction=(
        "You are an expert CS tutor for an OS and DBMS learning game called FLUX. "
        "Players simulate memory allocation, page replacement, B+ trees, and SQL operations. "
        "When a player fails repeatedly, give them a short, direct nudge — not a lecture. "
        "Respond ONLY in valid JSON matching the provided schema. No markdown, no preamble."
    )
)

class FeedbackResponse(BaseModel):
    message: str = Field(description="1-2 sentences: what went wrong and what to try.")
    hint: Optional[str] = Field(None, description="Concrete next step the player can take right now.")
    concept_reminder: Optional[str] = Field(None, description="CS concept name this relates to.")
    encouragement_level: int = Field(ge=1, le=5, description="1=struggling, 5=almost there.")
    suggested_command: Optional[str] = Field(None, description="Exact command player should try next.")

TOPIC_CONTEXT = {
    "memory": "Player is doing memory allocation. Commands: alloc <size>, free <pid>, compact. Goal involves achieving fragmentation or fitting processes.",
    "paging": "Player is doing page replacement. Commands: load <page>, access <page>. Goal involves page hits/faults with LRU/FIFO eviction.",
    "process": "Player is managing processes. Commands: fork, exec, kill <pid>, wait. Goal involves process state transitions.",
    "btree": "Player is building a B+ tree. Commands: insert <key>, search <key>, delete <key>. Goal involves node splits.",
    "sql": "Player is writing SQL. Commands: CREATE TABLE, INSERT, SELECT, JOIN. Goal involves correct queries.",
    "transaction": "Player is managing transactions. Commands: BEGIN, COMMIT, ROLLBACK, LOCK. Goal involves ACID properties.",
}

def _get_topic_context(slug: str) -> str:
    slug_lower = (slug or "").lower()
    for key, ctx in TOPIC_CONTEXT.items():
        if key in slug_lower:
            return ctx
    return "Player is practicing OS or DBMS concepts through an interactive simulator."


class FeedbackService:
    def __init__(self):
        self._available = bool(_api_key)

    def evaluate_goal(self, goal: dict, sim_state: dict) -> dict:
        g_type = goal.get("type")
        val = sim_state.get(g_type, 0)
        target = goal.get("target", 0)
        achieved = val >= target if g_type != "fragmentation" else val <= target
        return {"achieved": achieved, "current": val, "target": target}

    def get_failure_feedback(
        self,
        challenge_slug: str,
        recent_failures: list,
        sim_state: dict,
        goal: dict,
    ) -> FeedbackResponse:
        """Main Gemini call — triggered after 2-3 consecutive failures."""
        if not self._available:
            return self._static_fallback(challenge_slug, recent_failures)

        failure_summary = [
            {"command": f.get("action", "unknown"), "error": f.get("error") or f.get("output", "Failed")}
            for f in recent_failures[-3:]
        ]

        prompt_context = {
            "topic": challenge_slug,
            "topic_context": _get_topic_context(challenge_slug),
            "goal_description": goal.get("description", "Complete the challenge"),
            "recent_failures": failure_summary,
            "consecutive_failures": len(recent_failures),
            "sim_snapshot": {k: sim_state.get(k) for k in ["fragmentation", "free_memory", "allocated", "page_faults", "hits"] if k in sim_state},
        }

        try:
            response = _model.generate_content(
                f"Player context: {json.dumps(prompt_context)}\n\n"
                f"Return JSON: message (what went wrong + what to try), "
                f"hint (concrete next step), concept_reminder (CS term), "
                f"encouragement_level (1-5), suggested_command (exact command to try).",
                generation_config={
                    "response_mime_type": "application/json",
                    "temperature": 0.4,
                    "max_output_tokens": 300,
                },
            )
            return FeedbackResponse.model_validate_json(response.text)
        except Exception as e:
            print(f"[FeedbackService] Gemini error: {e}")
            return self._static_fallback(challenge_slug, recent_failures)

    def get_feedback(self, action: str, action_result: dict, sim_state: dict, goal: dict) -> FeedbackResponse:
        """Legacy single-action wrapper."""
        recent = [{"action": action, "error": action_result.get("error", ""), "output": action_result.get("message", "")}]
        return self.get_failure_feedback(
            challenge_slug=goal.get("slug", ""),
            recent_failures=recent,
            sim_state=sim_state,
            goal=goal,
        )

    def _static_fallback(self, slug: str, failures: list) -> FeedbackResponse:
        slug = (slug or "").lower()
        if "memory" in slug or "alloc" in slug:
            return FeedbackResponse(message="Allocation failing — check for contiguous free space.", hint="Try 'compact' to merge fragments, then retry your alloc.", concept_reminder="External Fragmentation", encouragement_level=3, suggested_command="compact")
        if "pag" in slug or "lru" in slug:
            return FeedbackResponse(message="Page replacement not going as expected.", hint="LRU evicts the least recently accessed page. Track your access order.", concept_reminder="LRU Page Replacement", encouragement_level=3, suggested_command=None)
        if "btree" in slug or "tree" in slug:
            return FeedbackResponse(message="B+ tree operation failed.", hint="Insert enough keys to trigger a node split — order-3 splits when a node has 3 keys.", concept_reminder="B+ Tree Node Splitting", encouragement_level=3, suggested_command="insert 30")
        return FeedbackResponse(message="You've hit a few errors. Re-read the goal panel carefully.", hint="The exact condition you need to meet is described in the goal.", concept_reminder=None, encouragement_level=2, suggested_command=None)


class _GoalEvaluator:
    def __init__(self, service: FeedbackService):
        self._svc = service
    def evaluate(self, goal: dict, sim_state: dict, action_result: dict = None) -> dict:
        return self._svc.evaluate_goal(goal, sim_state)

class _FeedbackEngine:
    def __init__(self, service: FeedbackService):
        self._svc = service
    def generate(self, action: str, action_result: dict, sim_state: dict, goal: dict, goal_result: dict) -> str:
        return self._svc.get_feedback(action, action_result, sim_state, goal).message

feedback_service = FeedbackService()
goal_evaluator   = _GoalEvaluator(feedback_service)
feedback_engine  = _FeedbackEngine(feedback_service)
