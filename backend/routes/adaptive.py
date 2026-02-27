""" routes connecting the AdaptiveEngine into the game API.
Mount at /game with `game_bp` Blueprint.

Endpoints:
  GET  /game/adaptive/hint              — get next hint for active session
  GET  /game/adaptive/difficulty/<slug>  — recommended difficulty for competency
  POST /game/adaptive/analyze           — analyze session event log for weak spots
  GET  /game/adaptive/challenge-type/<slug> — recommended challenge format
"""

from flask import Blueprint, request, jsonify

from database import SessionLocal
from models import GameSession, SimStateEnum
from auth_middleware import require_auth
from services.adaptive_engine import adaptive_engine

adaptive_bp = Blueprint("adaptive", __name__, url_prefix="/game/adaptive")


@adaptive_bp.route("/hint", methods=["GET"])
@require_auth
def get_hint(token_data):
    
    db = SessionLocal()
    try:
        session_token = request.args.get("session_token")
        challenge_slug = request.args.get("challenge_slug", "")
        current_hint_level = int(request.args.get("hint_level", 0))

        steps_since_success = 0
        session_accuracy = 0.5

        if session_token:
            sess = db.query(GameSession).filter_by(session_token=session_token).first()
            if sess and sess.user_id == token_data.user_id:
                event_log = sess.event_log or []
                if event_log:
                    # Count steps since last success
                    for entry in reversed(event_log):
                        if entry.get("success"):
                            break
                        steps_since_success += 1

                    total = len(event_log)
                    correct = sum(1 for e in event_log if e.get("success"))
                    session_accuracy = correct / total if total else 0

                    # Get challenge slug from session if not provided
                    if not challenge_slug and sess.challenge_id:
                        from models import Challenge
                        ch = db.get(Challenge, sess.challenge_id)
                        if ch:
                            challenge_slug = ch.slug

        hint = adaptive_engine.get_hint(
            challenge_slug=challenge_slug,
            steps_since_last_success=steps_since_success,
            session_accuracy=session_accuracy,
            current_hint_level=current_hint_level,
        )

        if not hint:
            return jsonify({"hint": None, "message": "No hint available yet. Keep trying!"})

        return jsonify({
            "hint": {
                "level": hint.level,
                "message": hint.message,
                "concept_reference": hint.concept_reference,
                "visual_cue": hint.visual_cue,
            },
            "steps_since_success": steps_since_success,
            "session_accuracy": round(session_accuracy, 3),
        })

    finally:
        db.close()


@adaptive_bp.route("/difficulty/<competency_slug>", methods=["GET"])
@require_auth
def get_difficulty(token_data, competency_slug: str):
    #returns recommended diffi
    db = SessionLocal()
    try:
        difficulty = adaptive_engine.get_target_difficulty(
            token_data.user_id, competency_slug, db
        )
        return jsonify({
            "competency": competency_slug,
            "recommended_difficulty": difficulty,
            "label": ["", "Beginner", "Easy", "Intermediate", "Advanced", "Expert"][difficulty],
        })
    finally:
        db.close()


@adaptive_bp.route("/analyze", methods=["POST"])
@require_auth
def analyze_session(token_data):
   
    db = SessionLocal()
    data = request.get_json() or {}
    try:
        token = data.get("session_token")
        if not token:
            return jsonify({"error": "session_token required"}), 400

        sess = db.query(GameSession).filter_by(session_token=token).first()
        if not sess or sess.user_id != token_data.user_id:
            return jsonify({"error": "Session not found"}), 404

        analysis = adaptive_engine.get_session_weak_spots(sess.event_log or [])

        # Add recommendation based on analysis
        challenge_type = None
        if sess.challenge_id:
            from models import Challenge
            ch = db.get(Challenge, sess.challenge_id)
            if ch and ch.competency:
                challenge_type = adaptive_engine.get_next_challenge_type(
                    token_data.user_id, ch.competency.slug, db
                )

        return jsonify({
            "analysis": analysis,
            "next_challenge_type": challenge_type,
            "recommendation": _build_recommendation(analysis),
        })
    finally:
        db.close()


@adaptive_bp.route("/challenge-type/<competency_slug>", methods=["GET"])
@require_auth
def get_challenge_type(token_data, competency_slug: str):
    #returns recommended challenge format
    db = SessionLocal()
    try:
        challenge_type = adaptive_engine.get_next_challenge_type(
            token_data.user_id, competency_slug, db
        )
        return jsonify({
            "competency": competency_slug,
            "recommended_type": challenge_type,
        })
    finally:
        db.close()


def _build_recommendation(analysis: dict) -> str:
    if analysis.get("stuck"):
        return "You seem stuck. Try the hint system — press 💡 in the terminal panel."
    if analysis.get("failure_rate", 0) > 0.6:
        failed = analysis.get("most_failed_action", "that command")
        return f"The `{failed}` command is failing most. Check its syntax in the goal panel."
    if analysis.get("accuracy", 0) > 0.8:
        return "Great accuracy! You're ready to try a harder difficulty."
    return "Keep going — you're making progress."