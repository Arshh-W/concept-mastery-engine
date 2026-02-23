from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime


#Auth 

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    name: Optional[str] = Field(None, max_length=100)

    @field_validator("password")
    @classmethod
    def no_spaces(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Password cannot contain spaces")
        return v

    model_config = {"json_schema_extra": {"examples": [{"email": "user@example.com", "password": "secure123", "name": "Alex"}]}}


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: int
    email: str


class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    is_active: bool
    created_at: datetime
    total_exp: int = 0
    model_config = {"from_attributes": True}


#Game APIs

class SessionStartRequest(BaseModel):
    challenge_slug: Optional[str] = None
    challenge_id:   Optional[int] = None

    @field_validator("challenge_slug", mode="before")
    @classmethod
    def either_or(cls, v, info):
        return v


class StepRequest(BaseModel):
    session_token: str
    action: str
    params: Optional[Dict[str, Any]] = Field(default_factory=dict)


class StepResponse(BaseModel):
    step:          int
    success:       bool
    result:        Dict[str, Any]
    sim_state:     Dict[str, Any]
    entropy:       float
    feedback:      str
    goal:          Dict[str, Any]
    score:         int
    score_delta:   int
    session_status: str