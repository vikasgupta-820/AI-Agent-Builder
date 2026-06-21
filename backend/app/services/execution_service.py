import json
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Optional

from langchain_core.messages import AIMessage, HumanMessage

from app.graph.builder import GraphBuilder, WorkflowValidationError
from app.graph.nodes import _graph_cache, _workflow_signature
from app.models.agent import AgentNode
from app.models.conversation import Message
from app.models.edge import Edge
from app.schemas.execution import ExecutionResponse
from app.services.conversation_service import ConversationService
from app.services.workflow_service import WorkflowService
from app.utils.logging import get_logger

logger = get_logger(__name__)


class ExecutionService:
    def __init__(self, workflow_service: WorkflowService, conv_service: ConversationService, gemini_api_key: str):
        self.workflow_service = workflow_service
        self.conv_service = conv_service
        self.gemini_api_key = gemini_api_key

    async def execute(
        self,
        workflow_id: str,
        input_message: str,
        conversation_id: Optional[str] = None,
        ws_send: Optional[Callable[[dict], Awaitable[None]]] = None,
    ) -> ExecutionResponse:
        """Execute a workflow and optionally stream events via WebSocket."""

        # Load workflow
        workflow = await self.workflow_service.get_workflow(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        agents: list[AgentNode] = workflow.agents
        edges: list[Edge] = workflow.edges

        # Build graph (cached — only recompiles if workflow structure changed)
        sig = _workflow_signature(agents, edges)
        if sig in _graph_cache:
            compiled_graph = _graph_cache[sig]
            logger.info("Using cached compiled graph")
        else:
            compiled_graph = GraphBuilder.build(agents, edges, self.gemini_api_key)
            _graph_cache[sig] = compiled_graph
            logger.info("Compiled and cached new graph")

        # Load or create conversation
        if conversation_id:
            conversation = await self.conv_service.get_conversation(conversation_id)
            if not conversation:
                conversation = await self.conv_service.create_conversation(
                    workflow_id, title=input_message[:50]
                )
        else:
            conversation = await self.conv_service.create_conversation(
                workflow_id, title=input_message[:50]
            )

        # Load message history
        history_messages = await self.conv_service.get_messages(conversation.id)
        lc_history = ConversationService.messages_to_langchain(history_messages)

        # Build initial state
        user_msg = HumanMessage(content=input_message)
        initial_state = {
            "messages": lc_history + [user_msg],
            "current_agent": None,
        }

        # Save user message
        await self.conv_service.add_message(
            conversation_id=conversation.id,
            role="user",
            content=input_message,
        )

        # Notify execution start
        if ws_send:
            await ws_send({
                "type": "execution_start",
                "run_id": conversation.id,
                "conversation_id": conversation.id,
            })

        # Execute graph with event streaming
        final_output = ""
        agent_names = {a.name for a in agents}
        # Track tool call IDs for linking tool results back to their calls
        pending_tool_calls: dict[str, str] = {}  # tool_name -> tool_call_id

        try:
            async for event in compiled_graph.astream_events(
                initial_state, version="v2"
            ):
                event_kind = event.get("event", "")
                event_name = event.get("name", "")

                # Agent node started
                if event_kind == "on_chain_start" and event_name in agent_names:
                    logger.info(f"[{event_name}] Started")
                    if ws_send:
                        await ws_send({
                            "type": "node_start",
                            "agent_name": event_name,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

                # Tool call started
                elif event_kind == "on_tool_start":
                    tool_name = event_name
                    tool_input = event.get("data", {}).get("input", {})
                    # Track tool call ID from the run_id or generate one
                    tool_run_id = event.get("run_id", "")
                    pending_tool_calls[tool_name] = tool_run_id
                    logger.info(f"Tool call: {tool_name}({tool_input})")
                    if ws_send:
                        await ws_send({
                            "type": "tool_call",
                            "agent_name": event.get("tags", [""])[0] if event.get("tags") else "",
                            "tool_name": tool_name,
                            "tool_input": tool_input,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

                # Tool call ended
                elif event_kind == "on_tool_end":
                    tool_output = event.get("data", {}).get("output", "")
                    # Save tool result to conversation history
                    tool_call_id = pending_tool_calls.pop(event_name, None)
                    await self.conv_service.add_message(
                        conversation_id=conversation.id,
                        role="tool",
                        content=str(tool_output),
                        tool_call_id=tool_call_id,
                    )
                    if ws_send:
                        await ws_send({
                            "type": "tool_result",
                            "tool_name": event_name,
                            "tool_output": str(tool_output),
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

                # Agent node completed
                elif event_kind == "on_chain_end" and event_name in agent_names:
                    output_data = event.get("data", {}).get("output", {})
                    # Extract the AI message content from the output
                    messages = output_data.get("messages", []) if isinstance(output_data, dict) else []
                    content = ""
                    if messages:
                        last_msg = messages[-1]
                        if hasattr(last_msg, "content"):
                            raw_content = last_msg.content
                        elif isinstance(last_msg, dict):
                            raw_content = last_msg.get("content", "")
                        else:
                            raw_content = ""

                        # Normalize content: Gemini 2.5+ may return list of text blocks
                        if isinstance(raw_content, list):
                            text_parts = []
                            for block in raw_content:
                                if isinstance(block, dict) and "text" in block:
                                    text_parts.append(block["text"])
                                elif isinstance(block, str):
                                    text_parts.append(block)
                            content = "\n".join(text_parts)
                        elif isinstance(raw_content, str):
                            content = raw_content
                        else:
                            content = str(raw_content)

                    if content:
                        final_output = content
                        # Extract tool_calls from the AI message if present
                        tool_calls_data = None
                        if messages:
                            last_msg = messages[-1]
                            raw_tool_calls = getattr(last_msg, "tool_calls", None) or (
                                last_msg.get("tool_calls") if isinstance(last_msg, dict) else None
                            )
                            if raw_tool_calls:
                                tool_calls_data = [
                                    {
                                        "id": tc.get("id", ""),
                                        "name": tc.get("name", ""),
                                        "args": tc.get("args", {}),
                                    }
                                    for tc in raw_tool_calls
                                ]
                        # Save agent message
                        await self.conv_service.add_message(
                            conversation_id=conversation.id,
                            role="assistant",
                            content=content,
                            agent_name=event_name,
                            tool_calls=tool_calls_data,
                        )

                    logger.info(f"[{event_name}] Completed")
                    if ws_send:
                        await ws_send({
                            "type": "node_output",
                            "agent_name": event_name,
                            "content": content,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                        })

        except Exception as e:
            logger.error(f"Execution error: {e}")
            if ws_send:
                await ws_send({
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            raise

        # Notify completion
        if ws_send:
            await ws_send({
                "type": "execution_complete",
                "run_id": conversation.id,
                "conversation_id": conversation.id,
                "final_output": final_output,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

        return ExecutionResponse(
            conversation_id=conversation.id,
            final_output=final_output,
            status="completed",
        )
