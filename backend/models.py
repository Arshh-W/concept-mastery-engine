from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class SubjectEnum(enum.Enum):
    OS = "OS"
    DBMS = "DBMS"

class User(Base):

    __tablename__  = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    total_exp =  Column(Integer, default=0)
    is_active = Column(Boolean, default=True) # for blocking user account

    progress = relationship("Progress", back_populates="user")
    def __repr__(self):
        return f"User: {self.email} (ID: {self.id})"
    
class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    subject = Column(Enum(SubjectEnum))
    difficulty = Column(Integer)

    progress = relationship("Progress", back_populates="module")

class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    module_id = Column(Integer, ForeignKey("modules.id"))
    high_score = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)

    user = relationship("User", back_populates="progress")
    module = relationship("Module", back_populates="progress")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String(100))
    description = Column(String(100))
    unlocked_at = Column(DateTime, server_default=func.now())

