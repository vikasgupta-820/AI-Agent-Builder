from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class ConversationCreate(BaseModel):
    workflow_id: str
    title: str = "New Conversation"


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    agent_name: Optional[str] = None
    role: str
    content: str
    tool_calls: Optional[Any] = None
    created_at: datetime


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    title: str
    messages: list[MessageRead] = []
    created_at: datetime
    updated_at: datetime


class ConversationListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    title: str
    created_at: datetime
    updated_at: datetime
