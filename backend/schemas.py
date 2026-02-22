from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=72, 
        description="Password must be between 8 and 72 characters"
    )
    name: Optional[str] = Field(
        None,
        max_length=100,
        description="User's display name"
    )

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if ' ' in v:
            raise ValueError('Password cannot contain spaces')
        return v
    
    model_config = {
        "json_schema_extra" : {
            "examples" : [
                {
                    "email": "user@example.com",
                    "password": "securePassword123",
                    "name": "Rote shik"
                }
            ]
        }
    }

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=72) 
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "securePassword123"
                }
            ]
        }
    }

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
    model_config = {
        "from_attributes" : True
    }

class GameState(BaseModel):
    module_id: int
    score: int
    attempts: int
    is_completed: bool

class UserAction(BaseModel):
    module_id: int
    action_type: str
    payload: Optional[Dict[str, Any]] = None

class FeedbackResponse(BaseModel):
    message: str
    score_delta: int
    new_state: GameState