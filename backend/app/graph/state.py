from typing import Annotated, Optional

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


def last_value(current: Optional[str], update: Optional[str]) -> Optional[str]:
    """Reducer that keeps the last value written."""
    return update


class WorkflowState(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]
    current_agent: Annotated[Optional[str], last_value]
