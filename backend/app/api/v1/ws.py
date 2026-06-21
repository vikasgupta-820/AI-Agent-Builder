import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.database import async_session_factory
from app.graph.builder import WorkflowValidationError
from app.services.conversation_service import ConversationService
from app.services.execution_service import ExecutionService
from app.services.workflow_service import WorkflowService
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/execute/{workflow_id}")
async def ws_execute(websocket: WebSocket, workflow_id: str):
    await websocket.accept()

    async with async_session_factory() as session:
        try:
            # Wait for the first message to get API key and input
            try:
                raw = await websocket.receive_text()
                client_msg = json.loads(raw)
            except (WebSocketDisconnect, json.JSONDecodeError):
                await websocket.close(code=1008, reason="Invalid first message")
                return

            api_key = client_msg.get("gemini_api_key", "")
            if not api_key:
                await websocket.send_json({
                    "type": "error",
                    "message": "Gemini API key is required. Provide it in the first message or in Settings.",
                })
                await websocket.close(code=1008, reason="No API key")
                return

            user_input = client_msg.get("input", "")
            conversation_id = client_msg.get("conversation_id")

            if not user_input:
                await websocket.send_json({
                    "type": "error",
                    "message": "No input provided",
                })
                await websocket.close(code=1008, reason="No input")
                return

            # Create execution service
            workflow_service = WorkflowService(session)
            conv_service = ConversationService(session)
            execution_service = ExecutionService(
                workflow_service=workflow_service,
                conv_service=conv_service,
                gemini_api_key=api_key,
            )

            async def ws_send(data: dict):
                try:
                    await websocket.send_json(data)
                except Exception:
                    logger.warning("WebSocket send failed (client likely disconnected)")

            try:
                await execution_service.execute(
                    workflow_id=workflow_id,
                    input_message=user_input,
                    conversation_id=conversation_id,
                    ws_send=ws_send,
                )
            except WorkflowValidationError as e:
                await ws_send({
                    "type": "error",
                    "message": f"Workflow validation error: {e}",
                })
            except Exception as e:
                logger.error(f"Execution error: {e}")
                await ws_send({
                    "type": "error",
                    "message": str(e),
                })
        finally:
            try:
                await websocket.close()
            except Exception:
                pass  # Already closed
