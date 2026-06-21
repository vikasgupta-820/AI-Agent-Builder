from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_conversation_service, get_workflow_service
from app.schemas.conversation import (
    ConversationCreate,
    ConversationListRead,
    ConversationRead,
)
from app.services.conversation_service import ConversationService
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("/", response_model=ConversationRead, status_code=201)
async def create_conversation(
    data: ConversationCreate,
    service: ConversationService = Depends(get_conversation_service),
    workflow_service: WorkflowService = Depends(get_workflow_service),
):
    # Validate workflow exists
    workflow = await workflow_service.get_workflow(data.workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    conversation = await service.create_conversation(data.workflow_id, data.title)
    return conversation


@router.get("/", response_model=list[ConversationListRead])
async def list_conversations(
    workflow_id: Optional[str] = Query(None),
    service: ConversationService = Depends(get_conversation_service),
):
    return await service.list_conversations(workflow_id)


@router.get("/{conversation_id}", response_model=ConversationRead)
async def get_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service),
):
    conversation = await service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversation


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    service: ConversationService = Depends(get_conversation_service),
):
    deleted = await service.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
