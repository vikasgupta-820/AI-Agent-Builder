from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.agent import AgentRead
from app.schemas.edge import EdgeRead


class WorkflowCreate(BaseModel):
    name: str
    description: str = ""


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    agents: list[AgentRead] = []
    edges: list[EdgeRead] = []
    created_at: datetime
    updated_at: datetime


class WorkflowListRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    created_at: datetime
    updated_at: datetime
