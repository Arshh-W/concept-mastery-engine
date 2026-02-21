from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.sql import func
from database import Base


class LearnerState(Base):

    __tablename__  = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(String(255), unique=True, index=True, nullable=False)
    p_mastery = Column(Float, nullable=False)
    attempts = Column(Integer, nullable=True, server_default=0)
    last_updated = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"User: {self.email} (ID: {self.id})"
