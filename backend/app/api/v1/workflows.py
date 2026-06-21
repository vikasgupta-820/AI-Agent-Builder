from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_execution_service, get_workflow_service
from app.schemas.execution import ExecutionRequest, ExecutionResponse
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowListRead,
    WorkflowRead,
    WorkflowUpdate,
)
from app.services.execution_service import ExecutionService
from app.services.workflow_service import WorkflowService
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("/", response_model=WorkflowRead, status_code=201)
async def create_workflow(
    data: WorkflowCreate,
    service: WorkflowService = Depends(get_workflow_service),
):
    workflow = await service.create_workflow(data)
    return workflow


@router.get("/", response_model=list[WorkflowListRead])
async def list_workflows(
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.list_workflows()


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    workflow = await service.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workflow_id: str,
    data: WorkflowUpdate,
    service: WorkflowService = Depends(get_workflow_service),
):
    workflow = await service.update_workflow(workflow_id, data)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.delete("/{workflow_id}", status_code=204)
async def delete_workflow(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    deleted = await service.delete_workflow(workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow not found")


@router.post("/{workflow_id}/execute", response_model=ExecutionResponse)
async def execute_workflow(
    workflow_id: str,
    data: ExecutionRequest,
    service: ExecutionService = Depends(get_execution_service),
):
    """Execute a workflow synchronously and return the final result."""
    from app.graph.builder import WorkflowValidationError

    try:
        result = await service.execute(
            workflow_id=workflow_id,
            input_message=data.input_message,
            conversation_id=data.conversation_id,
        )
        return result
    except WorkflowValidationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Execution error: {type(e).__name__}: {e}")
        error_msg = str(e)
        if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
            error_msg = "LLM API rate limit exceeded. Please wait a moment and try again."
        elif "API" in error_msg and "key" in error_msg.lower():
            error_msg = "Invalid or unauthorized API key."
        raise HTTPException(status_code=500, detail=error_msg)
