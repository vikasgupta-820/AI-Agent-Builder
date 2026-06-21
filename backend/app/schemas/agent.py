from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AgentCreate(BaseModel):
    name: str
    system_prompt: str
    role: str
    model: str = "gemini-2.5-flash"
    tools: Optional[list[str]] = None
    position_x: float = 0.0
    position_y: float = 0.0
    is_start: bool = False


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    system_prompt: Optional[str] = None
    role: Optional[str] = None
    model: Optional[str] = None
    tools: Optional[list[str]] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    is_start: Optional[bool] = None


class AgentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    name: str
    system_prompt: str
    role: str
    model: str
    tools: Optional[list[str]] = None
    position_x: float
    position_y: float
    is_start: bool
