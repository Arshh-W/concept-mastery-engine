from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Float, Enum, ForeignKey, Text, JSON
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class SubjectEnum(enum.Enum):
    OS   = "OS"
    DBMS = "DBMS"


class SimStateEnum(enum.Enum):
    ACTIVE    = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


#Users table for auth and user info

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, index=True, nullable=False)
    email         = Column(String(255), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    total_exp     = Column(Integer, default=0)
    is_active     = Column(Boolean, default=True)
    progress      = relationship("Progress",     back_populates="user")
    mastery       = relationship("MasteryState", back_populates="user")
    sessions      = relationship("GameSession",  back_populates="user")
    achievements  = relationship("Achievement",  back_populates="user")

    def __repr__(self):
        return f"User: {self.username} (ID: {self.id})"


#  Curriculum table, to store competencies and their relations, and map to challenges

class Competency(Base):
    __tablename__ = "competencies"

    id            = Column(Integer, primary_key=True)
    slug          = Column(String(100), unique=True, nullable=False)  
    name          = Column(String(200), nullable=False)
    domain        = Column(Enum(SubjectEnum), nullable=False)
    description   = Column(Text, nullable=True)
    dag_level     = Column(Integer, default=0)                         # depth in DAG
    prerequisites = Column(JSON, default=list)                        # list of competency requirements

    challenges    = relationship("Challenge",   back_populates="competency")
    mastery       = relationship("MasteryState", back_populates="competency")


class Challenge(Base):
    __tablename__ = "challenges"

    id              = Column(Integer, primary_key=True)
    slug            = Column(String(100), unique=True, nullable=False)
    competency_id   = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    title           = Column(String(200), nullable=False)
    narrative       = Column(Text, nullable=True)
    difficulty      = Column(Integer, default=1)                       
    order_index     = Column(Integer, default=0)
    initial_state   = Column(JSON, nullable=False)                     # simulator setup
    goal            = Column(JSON, nullable=False)                     # win condition
    allowed_commands= Column(JSON, default=list)
    hint            = Column(Text, nullable=True)
    concept_explanation = Column(Text, nullable=True)
    exp_reward      = Column(Integer, default=50)
    is_active       = Column(Boolean, default=True)

    competency      = relationship("Competency", back_populates="challenges")
    sessions        = relationship("GameSession", back_populates="challenge")


#Progress / Mastery tracking using BKT 

class MasteryState(Base):
    __tablename__ = "mastery_states"

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    competency_id  = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    p_mastery      = Column(Float, default=0.3)                        # BKT posterior
    attempts       = Column(Integer, default=0)
    correct        = Column(Integer, default=0)
    last_updated   = Column(DateTime(timezone=True), onupdate=func.now(),
                            server_default=func.now())

    user           = relationship("User",       back_populates="mastery")
    competency     = relationship("Competency", back_populates="mastery")


class Progress(Base):
    __tablename__ = "progress"

    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    challenge_id = Column(Integer, ForeignKey("challenges.id"))
    high_score   = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    attempts     = Column(Integer, default=0)
    first_completed_at = Column(DateTime(timezone=True), nullable=True)

    user         = relationship("User",      back_populates="progress")
    challenge    = relationship("Challenge")


#Game Sessions

class GameSession(Base):
    __tablename__ = "game_sessions"

    id              = Column(Integer, primary_key=True)
    session_token   = Column(String(64), unique=True, nullable=False, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    challenge_id    = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    status          = Column(Enum(SimStateEnum), default=SimStateEnum.ACTIVE)
    current_entropy = Column(Float, default=0.5)
    step_count      = Column(Integer, default=0)
    score           = Column(Integer, default=0)
    sim_state       = Column(JSON, default=dict)   # live serialized simulator state
    event_log       = Column(JSON, default=list)   # list of step events
    started_at      = Column(DateTime(timezone=True), server_default=func.now())
    ended_at        = Column(DateTime(timezone=True), nullable=True)

    user            = relationship("User",      back_populates="sessions")
    challenge       = relationship("Challenge", back_populates="sessions")


#Achievements

class Achievement(Base):
    __tablename__ = "achievements"

    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id"))
    name        = Column(String(100))
    description = Column(String(255))
    icon        = Column(String(50), nullable=True)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user        = relationship("User", back_populates="achievements")