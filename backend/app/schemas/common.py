from enum import Enum

from pydantic import BaseModel


class RoleEnum(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"


class ErrorResponse(BaseModel):
    detail: str
