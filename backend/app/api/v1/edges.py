from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_workflow_service
from app.schemas.edge import EdgeCreate, EdgeRead
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows/{workflow_id}/edges", tags=["edges"])


@router.post("/", response_model=EdgeRead, status_code=201)
async def create_edge(
    workflow_id: str,
    data: EdgeCreate,
    service: WorkflowService = Depends(get_workflow_service),
):
    edge = await service.create_edge(workflow_id, data)
    if not edge:
        raise HTTPException(
            status_code=400,
            detail="Invalid edge: check that agents exist, no self-loops, and no duplicates",
        )
    return edge


@router.get("/", response_model=list[EdgeRead])
async def list_edges(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.list_edges(workflow_id)


@router.delete("/{edge_id}", status_code=204)
async def delete_edge(
    workflow_id: str,
    edge_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    deleted = await service.delete_edge(workflow_id, edge_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Edge not found")
