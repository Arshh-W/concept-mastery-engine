"""

This is our Bayesian Knowledge Tracing (BKT) — updates mastery probability after each session based on probabilistic variables.
we manage the prerequisite DAG unlock logic and XP rewards here.
"""

from typing import Optional
from sqlalchemy.orm import Session

from models import MasteryState, Competency, Progress, User, Challenge, GameSession


#BKT parameters(will update to more accurate values after testing- pleasee remember lol)

P_TRANSIT = 0.09   # probability of learning the concept in one step
P_SLIP    = 0.10   # probability of wrong answer despite mastery
P_GUESS   = 0.20   # probability of right answer without mastery
MASTERY_THRESHOLD = 0.80  # p_mastery >= this → concept considered mastered


class BKTModel:
    """
    Standard Bayesian Knowledge Tracing model with parameters for learning, slip, guess
    it is Stateless — call update() per observation to get new mastery probability.
    """

    def __init__(
        self,
        p_transit: float = P_TRANSIT,
        p_slip:    float = P_SLIP,
        p_guess:   float = P_GUESS,
    ):
        self.p_transit = p_transit
        self.p_slip    = p_slip
        self.p_guess   = p_guess

    def update(self, p_mastery: float, correct: bool) -> float:
        #Returns updated P(mastery) given one observation
        p_correct_given_mastery    = 1.0 - self.p_slip
        p_correct_given_no_mastery = self.p_guess

        if correct:
            numerator   = p_mastery * p_correct_given_mastery
            denominator = (p_mastery * p_correct_given_mastery +
                           (1 - p_mastery) * p_correct_given_no_mastery)
        else:
            numerator   = p_mastery * self.p_slip
            denominator = (p_mastery * self.p_slip +
                           (1 - p_mastery) * (1 - p_correct_given_no_mastery))

        if denominator == 0:
            p_posterior = p_mastery
        else:
            p_posterior = numerator / denominator

        # Applying learning transition
        return p_posterior + (1.0 - p_posterior) * self.p_transit

    def bulk_update(self, p_mastery: float, results: list[bool]) -> float:
        
        for correct in results:
            p_mastery = self.update(p_mastery, correct)
        return p_mastery


_bkt = BKTModel()


#actual service functions for mastery updates, next competency recom, and progress recording

def get_or_create_mastery(db: Session, user_id: int, competency_id: int) -> MasteryState:
    ms = (
        db.query(MasteryState)
        .filter_by(user_id=user_id, competency_id=competency_id)
        .first()
    )
    if not ms:
        ms = MasteryState(user_id=user_id, competency_id=competency_id, p_mastery=0.3)
        db.add(ms)
        db.flush()
    return ms


def update_mastery_after_session(
    db: Session,
    user_id: int,
    competency_slug: str,
    step_results: list[bool],
) -> dict:
    """
    Called at session end.  Updates BKT state for the competency and returns
    the new p_mastery, also whether the concept is now considered mastered or not, basically the core of our review system.
    """
    competency = db.query(Competency).filter_by(slug=competency_slug).first()
    if not competency:
        return {"error": f"Competency '{competency_slug}' not found"}

    ms = get_or_create_mastery(db, user_id, competency.id)
    old_p = ms.p_mastery

    ms.p_mastery = _bkt.bulk_update(ms.p_mastery, step_results)
    ms.attempts += len(step_results)
    ms.correct  += sum(step_results)
    db.flush()

    return {
        "competency":  competency_slug,
        "old_p":       round(old_p, 4),
        "new_p":       round(ms.p_mastery, 4),
        "mastered":    ms.p_mastery >= MASTERY_THRESHOLD,
    }


def get_user_mastery_map(db: Session, user_id: int) -> dict:
    #Returns competency slug, p mastery for all competencies for the user( This is for the frontend dashoard and for recommendation logic)
    rows = (
        db.query(MasteryState, Competency)
        .join(Competency, MasteryState.competency_id == Competency.id)
        .filter(MasteryState.user_id == user_id)
        .all()
    )
    return {comp.slug: round(ms.p_mastery, 4) for ms, comp in rows}


def get_next_recommended_competency(db: Session, user_id: int, domain: Optional[str] = None) -> Optional[str]:
    """
    DAG-aware next competency selection:
    1. this is a Filter to competencies, in which prerequisites are all mastered
    2. Among those, we try to pick the one with lowest p_mastery to encourage to focus on weaker sections
    """
    mastery_map = get_user_mastery_map(db, user_id)
    mastered    = {slug for slug, p in mastery_map.items() if p >= MASTERY_THRESHOLD}

    query = db.query(Competency)
    if domain:
        from models import SubjectEnum
        query = query.filter(Competency.domain == SubjectEnum(domain))

    candidates = []
    for comp in query.order_by(Competency.dag_level).all():
        prereqs = comp.prerequisites or []
        if all(p in mastered for p in prereqs):
            p = mastery_map.get(comp.slug, 0.3)
            if p < MASTERY_THRESHOLD:
                candidates.append((p, comp.slug))

    if not candidates:
        return None
    candidates.sort()
    return candidates[0][1]


def record_challenge_completion(
    db: Session,
    user_id: int,
    challenge_id: int,
    score: int,
) -> dict:
    #insert the Progress row and award XP to the user.
    prog = (
        db.query(Progress)
        .filter_by(user_id=user_id, challenge_id=challenge_id)
        .first()
    )
    if not prog:
        prog = Progress(user_id=user_id, challenge_id=challenge_id)
        db.add(prog)

    prog.attempts += 1
    is_new_completion = not prog.is_completed

    if score > prog.high_score:
        prog.high_score = score

    exp_gained = 0
    if is_new_completion:
        from datetime import datetime, timezone
        prog.is_completed = True
        prog.first_completed_at = datetime.now(timezone.utc)

        challenge = db.get(Challenge, challenge_id)
        exp_gained = challenge.exp_reward if challenge else 50

        user = db.get(User, user_id)
        if user:
            user.total_exp += exp_gained

    db.flush()
    return {
        "high_score":      prog.high_score,
        "attempts":        prog.attempts,
        "is_new":          is_new_completion,
        "exp_gained":      exp_gained,
    }