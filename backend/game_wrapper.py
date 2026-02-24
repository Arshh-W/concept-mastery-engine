"""
routes/game.py
Handles game session lifecycle: listing challenges, starting sessions, stepping through actions, and ending sessions.
"""

import secrets
from datetime import datetime, timezone

from flask import Blueprint, request, jsonify

from database import SessionLocal
from models   import GameSession, SimStateEnum
from auth_middleware import require_auth
from services.challenge_service import (
    get_challenges_for_domain,
    get_challenge_by_slug,
    get_challenge_by_id,
    _challenge_to_dict,
)
from services.progress_service import (
    get_user_mastery_map,
    update_mastery_after_session,
    get_next_recommended_competency,
    record_challenge_completion,
)
from services.feedback_service import goal_evaluator, feedback_engine
from simulators.sim_session import SimSession, DOMAIN_OS, DOMAIN_DBMS

game_bp = Blueprint("game", __name__, url_prefix="/game")


def _domain_str(domain: str) -> str:
    return DOMAIN_OS if domain.upper() == "OS" else DOMAIN_DBMS


def _session_or_404(db, token: str):
    sess = db.query(GameSession).filter_by(session_token=token).first()
    if not sess:
        return None, (jsonify({"error": "Session not found"}), 404)
    return sess, None


#challenge listing

@game_bp.route("/challenges/<domain>", methods=["GET"])
@require_auth
def list_challenges(token_data, domain: str):
    db = SessionLocal()
    try:
        challenges = get_challenges_for_domain(db, domain)

        mastery_map = get_user_mastery_map(db, token_data.user_id)

        # Annotate each challenge with user's mastery for its competency
        for ch in challenges:
            slug = ch.get("competency")
            ch["mastery"] = mastery_map.get(slug, 0.3)

        return jsonify({"domain": domain.upper(), "challenges": challenges})
    finally:
        db.close()


#session start

@game_bp.route("/session/start", methods=["POST"])
@require_auth
def start_session(token_data):
    """
    Body: { "challenge_slug": "os_mem_01" }
          or { "challenge_id": 3 }
    """
    db   = SessionLocal()
    data = request.get_json() or {}

    try:
        # Load challenge
        challenge = None
        if "challenge_slug" in data:
            challenge = get_challenge_by_slug(db, data["challenge_slug"])
        elif "challenge_id" in data:
            challenge = get_challenge_by_id(db, int(data["challenge_id"]))

        if not challenge:
            return jsonify({"error": "Challenge not found"}), 404

        domain_str = challenge.competency.domain.value   # "OS" or "DBMS"

        # Buildiing simulator session from challenge initial_state
        sim = SimSession(
            domain=_domain_str(domain_str),
            initial_state=challenge.initial_state,
        )

        # Persist game session
        token = secrets.token_hex(32)
        gs = GameSession(
            session_token=token,
            user_id=token_data.user_id,
            challenge_id=challenge.id,
            status=SimStateEnum.ACTIVE,
            sim_state=sim.to_dict(),
            event_log=[],
        )
        db.add(gs)
        db.commit()

        return jsonify({
            "sessionToken":  token,
            "challenge":     _challenge_to_dict(challenge),
            "initialState":  sim.get_state(),
            "allowedCommands": challenge.allowed_commands,
            "goal": {
                "type":        challenge.goal.get("type"),
                "description": challenge.goal.get("description", ""),
                "params":      challenge.goal.get("params", {}),
            },
            "hint":      challenge.hint,
            "narrative": challenge.narrative,
        }), 201

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


#session step

@game_bp.route("/session/step", methods=["POST"])
@require_auth
def session_step(token_data):
    """
    Body: {
      "sessionToken": "<token>",
      "action": "alloc",
      "params": { "size": 256 }
    }
    """
    db   = SessionLocal()
    data = request.get_json() or {}

    try:
        token = data.get("sessionToken")
        if not token:
            return jsonify({"error": "Missing sessionToken"}), 400

        gs, err = _session_or_404(db, token)
        if err:
            return err

        if gs.user_id != token_data.user_id:
            return jsonify({"error": "Forbidden"}), 403

        if gs.status != SimStateEnum.ACTIVE:
            return jsonify({"error": "Session is not active"}), 400

        challenge = get_challenge_by_id(db, gs.challenge_id)
        if not challenge:
            return jsonify({"error": "Challenge not found"}), 404

        # Validate command is allowed
        action = data.get("action", "").lower()
        allowed = [c.lower() for c in (challenge.allowed_commands or [])]
        if allowed and action not in allowed:
            return jsonify({
                "error": f"Command '{action}' not allowed in this challenge",
                "allowedCommands": challenge.allowed_commands,
            }), 400

        # Rehydrating the simulator
        sim = SimSession.from_dict(gs.sim_state, challenge.initial_state)

        # Apply action
        step_result = sim.apply_action(action, data.get("params", {}))
        action_result = step_result["result"]
        new_state     = step_result["sim_state"]

        # Evaluate goal
        goal_result = goal_evaluator.evaluate(challenge.goal, new_state, action_result)

        # Generate feedback
        feedback = feedback_engine.generate(
            action, action_result, new_state, challenge.goal, goal_result
        )

        # Compute step score delta
        score_delta = 10 if action_result.get("success") else 0
        if goal_result.get("achieved"):
            score_delta += 50

        # Build event log entry
        log_entry = {
            "step":        step_result["step"],
            "action":      action,
            "params":      data.get("params", {}),
            "success":     action_result.get("success"),
            "feedback":    feedback,
            "goal":        goal_result,
            "entropy":     step_result["entropy"],
            "scoreDelta":  score_delta,
            "timestamp":   datetime.now(timezone.utc).isoformat(),
        }

        gs.sim_state    = sim.to_dict()
        gs.event_log    = (gs.event_log or []) + [log_entry]
        gs.step_count   = step_result["step"]
        gs.score        = (gs.score or 0) + score_delta
        gs.current_entropy = step_result["entropy"]

        if goal_result.get("achieved"):
            gs.status   = SimStateEnum.COMPLETED
            gs.ended_at = datetime.now(timezone.utc)

        db.commit()

        response = {
            "step":        step_result["step"],
            "success":     action_result.get("success"),
            "result":      action_result,
            "simState":    new_state,
            "entropy":     step_result["entropy"],
            "feedback":    feedback,
            "goal":        goal_result,
            "score":       gs.score,
            "scoreDelta":  score_delta,
            "sessionStatus": gs.status.value,
        }

        if goal_result.get("achieved"):
            response["completionPreview"] = {
                "message": "Challenge complete! Submit /session/end to save your progress.",
                "score":   gs.score,
            }

        return jsonify(response)

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# session state

@game_bp.route("/session/<token>/state", methods=["GET"])
@require_auth
def get_session_state(token_data, token: str):
    db = SessionLocal()
    try:
        gs, err = _session_or_404(db, token)
        if err:
            return err
        if gs.user_id != token_data.user_id:
            return jsonify({"error": "Forbidden"}), 403

        return jsonify({
            "sessionToken":  token,
            "status":        gs.status.value,
            "step":          gs.step_count,
            "score":         gs.score,
            "entropy":       gs.current_entropy,
            "simState":      gs.sim_state,
            "eventLog":      gs.event_log,
        })
    finally:
        db.close()


# session end

@game_bp.route("/session/<token>/end", methods=["POST"])
@require_auth
def end_session(token_data, token: str):
    db = SessionLocal()
    try:
        gs, err = _session_or_404(db, token)
        if err:
            return err
        if gs.user_id != token_data.user_id:
            return jsonify({"error": "Forbidden"}), 403

        if gs.status == SimStateEnum.ABANDONED:
            return jsonify({"error": "Session already ended"}), 400

        challenge = get_challenge_by_id(db, gs.challenge_id)

        if gs.status == SimStateEnum.ACTIVE:
            gs.status   = SimStateEnum.ABANDONED
            gs.ended_at = datetime.now(timezone.utc)

        step_results = [
            bool(entry.get("success")) for entry in (gs.event_log or [])
        ]

        # BKT update
        competency_slug = challenge.competency.slug if challenge and challenge.competency else None
        mastery_update  = {}
        if competency_slug and step_results:
            mastery_update = update_mastery_after_session(
                db, token_data.user_id, competency_slug, step_results
            )

        # Record completion (if achieved)
        completion = {}
        if gs.status == SimStateEnum.COMPLETED:
            completion = record_challenge_completion(
                db, token_data.user_id, gs.challenge_id, gs.score or 0
            )

        # Next recommendation
        domain = challenge.competency.domain.value if challenge and challenge.competency else None
        next_slug = get_next_recommended_competency(db, token_data.user_id, domain)

        db.commit()

        return jsonify({
            "sessionToken":    token,
            "status":          gs.status.value,
            "finalScore":      gs.score,
            "totalSteps":      gs.step_count,
            "masteryUpdate":   mastery_update,
            "completion":      completion,
            "nextCompetency":  next_slug,
        })

    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        db.close()


# user dashboard

@game_bp.route("/user/progress", methods=["GET"])
@require_auth
def user_progress(token_data):
   #full dashboard data for the user: total exp, mastery map and completed challenges with scores and attempts for frontend
    from models import User, Progress, Challenge as ChallengeModel, Competency, MasteryState
    db = SessionLocal()
    try:
        user = db.query(User).get(token_data.user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        mastery_map = get_user_mastery_map(db, token_data.user_id)

        completed = (
            db.query(Progress)
            .filter_by(user_id=token_data.user_id, is_completed=True)
            .all()
        )

        return jsonify({
            "userId":       user.id,
            "username":     user.username,
            "totalExp":     user.total_exp,
            "masteryMap":   mastery_map,
            "completedChallenges": [
                {
                    "challengeId": p.challenge_id,
                    "highScore":   p.high_score,
                    "attempts":    p.attempts,
                }
                for p in completed
            ],
        })
    finally:
        db.close()


@game_bp.route("/user/next", methods=["GET"])
@require_auth
def user_next(token_data):
    #returns next recommended competency and first incomplete challenge for it
    domain = request.args.get("domain")
    db     = SessionLocal()
    try:
        slug = get_next_recommended_competency(db, token_data.user_id, domain)
        if not slug:
            return jsonify({"message": "All competencies mastered!", "next": None})

        comp = db.query(Competency).filter_by(slug=slug).first()
        # Get first incomplete challenge for this competency
        challenge = (
            db.query(Challenge)
            .filter_by(competency_id=comp.id, is_active=True)
            .order_by(Challenge.order_index)
            .first()
        ) if comp else None

        return jsonify({
            "nextCompetency": slug,
            "challenge":      _challenge_to_dict(challenge) if challenge else None,
        })
    finally:
        db.close()