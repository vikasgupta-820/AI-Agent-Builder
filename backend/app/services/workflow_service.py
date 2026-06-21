from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workflow import Workflow
from app.models.agent import AgentNode
from app.models.edge import Edge
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
from app.schemas.agent import AgentCreate, AgentUpdate
from app.schemas.edge import EdgeCreate
from app.utils.logging import get_logger

logger = get_logger(__name__)


class WorkflowService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Workflow CRUD ---

    async def create_workflow(self, data: WorkflowCreate) -> Workflow:
        workflow = Workflow(name=data.name, description=data.description)
        self.db.add(workflow)
        await self.db.commit()
        # Re-fetch with eager-loaded relationships to avoid MissingGreenlet
        return await self.get_workflow(workflow.id)

    async def list_workflows(self) -> list[Workflow]:
        result = await self.db.execute(
            select(Workflow).order_by(Workflow.updated_at.desc())
        )
        return list(result.scalars().all())

    async def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        result = await self.db.execute(
            select(Workflow)
            .where(Workflow.id == workflow_id)
            .options(selectinload(Workflow.agents), selectinload(Workflow.edges))
        )
        return result.scalar_one_or_none()

    async def update_workflow(
        self, workflow_id: str, data: WorkflowUpdate
    ) -> Optional[Workflow]:
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(workflow, key, value)
        await self.db.commit()
        return await self.get_workflow(workflow_id)

    async def delete_workflow(self, workflow_id: str) -> bool:
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            return False
        await self.db.delete(workflow)
        await self.db.commit()
        return True

    # --- Agent CRUD ---

    async def create_agent(
        self, workflow_id: str, data: AgentCreate
    ) -> Optional[AgentNode]:
        workflow = await self.get_workflow(workflow_id)
        if not workflow:
            return None

        # If this agent is the start, unset is_start on all others
        if data.is_start:
            await self.db.execute(
                update(AgentNode)
                .where(AgentNode.workflow_id == workflow_id)
                .values(is_start=False)
            )

        agent = AgentNode(
            workflow_id=workflow_id,
            name=data.name,
            system_prompt=data.system_prompt,
            role=data.role,
            model=data.model,
            tools=data.tools,
            position_x=data.position_x,
            position_y=data.position_y,
            is_start=data.is_start,
        )
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def list_agents(self, workflow_id: str) -> list[AgentNode]:
        result = await self.db.execute(
            select(AgentNode).where(AgentNode.workflow_id == workflow_id)
        )
        return list(result.scalars().all())

    async def get_agent(
        self, workflow_id: str, agent_id: str
    ) -> Optional[AgentNode]:
        result = await self.db.execute(
            select(AgentNode).where(
                AgentNode.id == agent_id,
                AgentNode.workflow_id == workflow_id,
            )
        )
        return result.scalar_one_or_none()

    async def update_agent(
        self, workflow_id: str, agent_id: str, data: AgentUpdate
    ) -> Optional[AgentNode]:
        agent = await self.get_agent(workflow_id, agent_id)
        if not agent:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # If setting is_start=True, unset others
        if update_data.get("is_start"):
            await self.db.execute(
                update(AgentNode)
                .where(AgentNode.workflow_id == workflow_id, AgentNode.id != agent_id)
                .values(is_start=False)
            )

        for key, value in update_data.items():
            setattr(agent, key, value)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def delete_agent(self, workflow_id: str, agent_id: str) -> bool:
        agent = await self.get_agent(workflow_id, agent_id)
        if not agent:
            return False
        await self.db.delete(agent)
        await self.db.commit()
        return True

    # --- Edge CRUD ---

    async def create_edge(
        self, workflow_id: str, data: EdgeCreate
    ) -> Optional[Edge]:
        # Validate both agents exist in this workflow
        source = await self.get_agent(workflow_id, data.source_agent_id)
        target = await self.get_agent(workflow_id, data.target_agent_id)
        if not source or not target:
            return None

        # No self-loops
        if data.source_agent_id == data.target_agent_id:
            return None

        edge = Edge(
            workflow_id=workflow_id,
            source_agent_id=data.source_agent_id,
            target_agent_id=data.target_agent_id,
            label=data.label,
            condition=data.condition,
        )
        self.db.add(edge)
        try:
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to create edge: {e}")
            await self.db.rollback()
            return None
        await self.db.refresh(edge)
        return edge

    async def list_edges(self, workflow_id: str) -> list[Edge]:
        result = await self.db.execute(
            select(Edge).where(Edge.workflow_id == workflow_id)
        )
        return list(result.scalars().all())

    async def delete_edge(self, workflow_id: str, edge_id: str) -> bool:
        result = await self.db.execute(
            select(Edge).where(
                Edge.id == edge_id, Edge.workflow_id == workflow_id
            )
        )
        edge = result.scalar_one_or_none()
        if not edge:
            return False
        await self.db.delete(edge)
        await self.db.commit()
        return True
