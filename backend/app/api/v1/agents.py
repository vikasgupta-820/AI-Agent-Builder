from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_workflow_service
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate
from app.services.workflow_service import WorkflowService

router = APIRouter(prefix="/workflows/{workflow_id}/agents", tags=["agents"])


@router.post("/", response_model=AgentRead, status_code=201)
async def create_agent(
    workflow_id: str,
    data: AgentCreate,
    service: WorkflowService = Depends(get_workflow_service),
):
    agent = await service.create_agent(workflow_id, data)
    if not agent:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return agent


@router.get("/", response_model=list[AgentRead])
async def list_agents(
    workflow_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    return await service.list_agents(workflow_id)


@router.put("/{agent_id}", response_model=AgentRead)
async def update_agent(
    workflow_id: str,
    agent_id: str,
    data: AgentUpdate,
    service: WorkflowService = Depends(get_workflow_service),
):
    agent = await service.update_agent(workflow_id, agent_id, data)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    workflow_id: str,
    agent_id: str,
    service: WorkflowService = Depends(get_workflow_service),
):
    deleted = await service.delete_agent(workflow_id, agent_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agent not found")
