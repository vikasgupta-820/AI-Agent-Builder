from typing import Optional

from pydantic import BaseModel


class ExecutionRequest(BaseModel):
    input_message: str
    conversation_id: Optional[str] = None
    gemini_api_key: Optional[str] = None


class ExecutionResponse(BaseModel):
    conversation_id: str
    final_output: str
    status: str
    error: Optional[str] = None


class WSClientMessage(BaseModel):
    type: str  # "start", "user_input", "cancel"
    input: Optional[str] = None
    conversation_id: Optional[str] = None
    gemini_api_key: Optional[str] = None
