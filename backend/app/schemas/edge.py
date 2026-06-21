from typing import Optional

from pydantic import BaseModel, ConfigDict


class EdgeCreate(BaseModel):
    source_agent_id: str
    target_agent_id: str
    label: Optional[str] = None
    condition: Optional[str] = None


class EdgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    workflow_id: str
    source_agent_id: str
    target_agent_id: str
    condition: Optional[str] = None
    label: Optional[str] = None
