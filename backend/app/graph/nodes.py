import asyncio
import re
from typing import Awaitable, Callable

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.graph.state import WorkflowState
from app.graph.tools.registry import get_tools
from app.models.agent import AgentNode
from app.utils.logging import get_logger

logger = get_logger(__name__)

MAX_TOOL_ITERATIONS = 3
MAX_RETRIES = 2
RETRY_BASE_DELAY = 10  # seconds — long enough for per-minute limits to reset

# Pattern to detect daily quota exhaustion (not just per-minute rate limit)
DAILY_QUOTA_PATTERN = re.compile(
    r"GenerateRequestsPerDay|daily.*quota|per.?day.*limit",
    re.IGNORECASE,
)


async def invoke_with_retry(llm, messages, max_retries=MAX_RETRIES):
    """Invoke LLM with retry logic for rate limit errors.

    Distinguishes daily quota exhaustion (fail fast) from per-minute
    rate limits (retry with exponential backoff).
    """
    for attempt in range(max_retries):
        try:
            return await llm.ainvoke(messages)
        except Exception as e:
            error_str = str(e)
            is_rate_limit = "429" in error_str or "RESOURCE_EXHAUSTED" in error_str

            if not is_rate_limit:
                raise

            # Daily quota exhausted — no point retrying, fail immediately
            if DAILY_QUOTA_PATTERN.search(error_str):
                logger.error(
                    "Daily API quota exhausted. Upgrade your plan or wait until "
                    "tomorrow. See: https://ai.google.dev/gemini-api/docs/rate-limits"
                )
                raise

            # Per-minute rate limit — retry with backoff
            if attempt < max_retries - 1:
                delay = RETRY_BASE_DELAY * (2 ** attempt)
                logger.warning(
                    f"Rate limit hit, retrying in {delay}s "
                    f"(attempt {attempt + 1}/{max_retries})"
                )
                await asyncio.sleep(delay)
            else:
                raise


# Cache for compiled graphs: workflow_signature -> compiled_graph
_graph_cache: dict[str, object] = {}
_graph_cache_signatures: dict[str, str] = {}


def _workflow_signature(agents: list[AgentNode], edges) -> str:
    """Create a signature for the workflow structure to enable caching."""
    agent_sigs = "|".join(
        f"{a.name}:{a.model}:{a.system_prompt[:50]}:{a.tools}" for a in agents
    )
    edge_sigs = "|".join(f"{e.source_agent_id}:{e.target_agent_id}" for e in edges)
    return f"{agent_sigs}>>>{edge_sigs}"


class NodeFactory:
    @staticmethod
    def create_agent_node(
        agent: AgentNode, api_key: str
    ) -> Callable[[WorkflowState], Awaitable[dict]]:
        """Create an async callable that acts as a LangGraph node for this agent."""

        # Create LLM once outside the closure — reuse across invocations
        llm = ChatGoogleGenerativeAI(
            model=agent.model,
            google_api_key=api_key,
            temperature=0.7,
        )

        # Bind tools once
        tool_list = []
        if agent.tools:
            tool_list = get_tools(agent.tools)
            if tool_list:
                llm = llm.bind_tools(tool_list)

        async def agent_node(state: WorkflowState) -> dict:
            logger.info(f"Agent [{agent.name}] starting processing")

            # Build message list: system prompt + recent conversation history
            # Limit history to last 20 messages to conserve tokens
            messages = [SystemMessage(content=agent.system_prompt)]
            history = state["messages"]
            if len(history) > 20:
                logger.info(
                    f"Truncating history from {len(history)} to last 20 messages"
                )
                messages.extend(history[-20:])
            else:
                messages.extend(history)

            # Tool-calling loop
            current_llm = llm
            for iteration in range(MAX_TOOL_ITERATIONS):
                response = await invoke_with_retry(current_llm, messages)

                # If no tool calls, we're done
                if not hasattr(response, "tool_calls") or not response.tool_calls:
                    logger.info(f"Agent [{agent.name}] completed")
                    return {
                        "messages": [response],
                        "current_agent": agent.name,
                    }

                # Process tool calls
                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call["name"]
                    tool_args = tool_call["args"]
                    tool_id = tool_call["id"]

                    logger.info(
                        f"Agent [{agent.name}] calling tool '{tool_name}' "
                        f"with args: {tool_args}"
                    )

                    # Find and execute the tool
                    tool_result = None
                    for t in tool_list:
                        if t.name == tool_name:
                            tool_result = await t.ainvoke(tool_args)
                            break

                    if tool_result is None:
                        tool_result = f"Tool '{tool_name}' not found"

                    messages.append(
                        ToolMessage(
                            content=str(tool_result),
                            tool_call_id=tool_id,
                        )
                    )

            # Max iterations reached — return the last response as-is
            # (avoid making yet another API call just to strip tool_calls)
            logger.warning(
                f"Agent [{agent.name}] reached max tool iterations ({MAX_TOOL_ITERATIONS})"
            )
            if messages and isinstance(messages[-1], AIMessage):
                return {
                    "messages": [messages[-1]],
                    "current_agent": agent.name,
                }
            # Fallback: one final call without tools
            final_ll = ChatGoogleGenerativeAI(
                model=agent.model,
                google_api_key=api_key,
                temperature=0.7,
            )
            response = await invoke_with_retry(final_ll, messages)
            return {
                "messages": [response],
                "current_agent": agent.name,
            }

        # Set the node name so LangGraph events can be matched
        agent_node.__name__ = agent.name
        return agent_node
