"""
Loading challenge definitions from content/os/ and content/dbms/
JSOn files containing both competency and challenge info, following the schema defined
Also provides DB seeding and challenge lookup auxillary functions.
"""

import json
import os
from pathlib import Path
from typing import Optional

from sqlalchemy.orm import Session
from models import Challenge, Competency, SubjectEnum


CONTENT_DIR = Path(__file__).parent / "content"


def _load_json_files(domain: str) -> list[dict]:
    folder = CONTENT_DIR / domain.lower()
    if not folder.exists():
        return []
    challenges = []
    for f in sorted(folder.glob("*.json")):
        try:
            challenges.append(json.loads(f.read_text()))
        except Exception as e:
            print(f"[challenge_service] Failed to load {f}: {e}")
    return challenges


def seed_challenges(db: Session):
    for domain_str in ("os", "dbms"):
        domain_enum = SubjectEnum.OS if domain_str == "os" else SubjectEnum.DBMS

        for data in _load_json_files(domain_str):
           
            comp_slug = data.get("competency")
            comp = db.query(Competency).filter_by(slug=comp_slug).first()
            if not comp:
                comp = Competency(
                    slug=comp_slug,
                    name=data.get("competency_name", comp_slug),
                    domain=domain_enum,
                    description=data.get("concept_explanation", ""),
                    dag_level=data.get("dag_level", 0),
                    prerequisites=data.get("prerequisites", []),
                )
                db.add(comp)
                db.flush()

            ch_slug = data.get("id") or data.get("slug")
            if not ch_slug:
                continue
            ch = db.query(Challenge).filter_by(slug=ch_slug).first()
            if not ch:
                ch = Challenge(
                    slug=ch_slug,
                    competency_id=comp.id,
                    title=data.get("title", ch_slug),
                    narrative=data.get("narrative", ""),
                    difficulty=data.get("difficulty", 1),
                    order_index=data.get("order_index", 0),
                    initial_state=data.get("initial_state", {}),
                    goal=data.get("goal", {}),
                    allowed_commands=data.get("allowed_commands", []),
                    hint=data.get("hint", ""),
                    concept_explanation=data.get("concept_explanation", ""),
                    exp_reward=data.get("exp_reward", 50),
                )
                db.add(ch)

    db.commit()
    print("[challenge_service] Seed complete.")


def get_challenges_for_domain(db: Session, domain: str) -> list[dict]:
    domain_enum = SubjectEnum.OS if domain.upper() == "OS" else SubjectEnum.DBMS
    challenges = (
        db.query(Challenge)
        .join(Competency)
        .filter(Competency.domain == domain_enum, Challenge.is_active == True)
        .order_by(Competency.dag_level, Challenge.order_index)
        .all()
    )
    return [_challenge_to_dict(ch) for ch in challenges]


def get_challenge_by_slug(db: Session, slug: str) -> Optional[Challenge]:
    return db.query(Challenge).filter_by(slug=slug, is_active=True).first()


def get_challenge_by_id(db: Session, challenge_id: int) -> Optional[Challenge]:
    return db.query(Challenge).filter_by(id=challenge_id, is_active=True).first()


def _challenge_to_dict(ch: Challenge) -> dict:
    return {
        "id":                ch.id,
        "slug":              ch.slug,
        "title":             ch.title,
        "narrative":         ch.narrative,
        "difficulty":        ch.difficulty,
        "competency":        ch.competency.slug if ch.competency else None,
        "domain":            ch.competency.domain.value if ch.competency else None,
        "allowedCommands":   ch.allowed_commands,
        "hint":              ch.hint,
        "conceptExplanation": ch.concept_explanation,
        "expReward":         ch.exp_reward,
        "goal": {
            "type":        ch.goal.get("type"),
            "description": ch.goal.get("description", ""),
        },
    }