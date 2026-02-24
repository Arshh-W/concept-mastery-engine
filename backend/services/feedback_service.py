""" 
Atharva yahaan par feedback service ka code daaldena, 
make a basic gemini api call to get the feedback, data me usse current state ka info bhejda it doesn't have to be 
too detailed, just a simple call, haan ek particular schema bna lena still using pydantic to keep the responses uniform.


Baaki sabh ready h, I'll get started on the wrapper now
"""
import os
import json
from typing import Any, Optional
import google.generativeai as genai
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

#Config and Client setup
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
model = genai.GenerativeModel("gemini-2.5-flash")

#Pydantic scheme for the feedback
class FeedbackResponse(BaseModel):
    message: str = Field(description="1-2 sentences on the action.")
    hint: Optional[str] = Field(None, description="Nudge if failed or stuck.")
    concept_reminder: Optional[str] = Field(None, description="Brief the CS concept link.")
    encouragement_level: int = Field(ge=1, le=5)

class FeedbackService:
    def __init__(self):
        self.system_prompt = (
            "You are a CS tutor for our OS/DBMS game. Respond ONLY in valid JSON "
            "matching the provided schema. Be concise."
        )

    def evaluate_goal(self, goal: dict, sim_state: dict) -> dict:
        """Simple deterministic check for goal progress."""
        g_type = goal.get("type")
        val = sim_state.get(g_type, 0)
        target = goal.get("target", 0)
        
        achieved = val >= target if g_type != "fragmentation" else val <= target
        return {"achieved": achieved, "current": val, "target": target}

    def get_feedback(self, action: str, action_result: dict, sim_state: dict, goal: dict) -> FeedbackResponse:
        goal_status = self.evaluate_goal(goal, sim_state)
        
        #preparing brief context for the api call
        context = {
            "last_action": action,
            "success": action_result.get("success"),
            "goal": goal.get("description"),
            "goal_achieved": goal_status["achieved"],
            "state_snapshot": {k: sim_state.get(k) for k in ["memory", "fragmentation", "queue"]}
        }

        try:
            #forcing Gemini to return valid JSON
            response = model.generate_content(
                f"{self.system_prompt}\n\nContext: {json.dumps(context)}",
                generation_config={"response_mime_type": "application/json"}
            )
            return FeedbackResponse.model_validate_json(response.text)
        except Exception as e:
            print(f"Gemini Error: {e}")
            return self._fallback(action_result, goal_status)

    def _fallback(self, action_result, goal_status) -> FeedbackResponse:
        msg = "Goal reached!" if goal_status["achieved"] else action_result.get("message", "Keep trying!")
        return FeedbackResponse(
            message=msg,
            encouragement_level=3,
            hint="Try checking your parameters again."
        )

#for the wrapper to call
feedback_service = FeedbackService()