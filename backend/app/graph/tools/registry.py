from langchain_core.tools import BaseTool

from app.graph.tools.calculator import calculator
from app.graph.tools.web_search import web_search
from app.utils.logging import get_logger

logger = get_logger(__name__)

TOOL_REGISTRY: dict[str, BaseTool] = {
    "calculator": calculator,
    "web_search": web_search,
}


def get_tools(tool_names: list[str]) -> list[BaseTool]:
    """Return LangChain tool objects for the given tool names."""
    tools = []
    for name in tool_names:
        if name in TOOL_REGISTRY:
            tools.append(TOOL_REGISTRY[name])
        else:
            logger.warning(f"Unknown tool '{name}' not found in registry. Available: {list(TOOL_REGISTRY.keys())}")
    return tools
