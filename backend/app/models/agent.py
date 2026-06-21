import uuid
from typing import Optional

from sqlalchemy import Boolean, Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AgentNode(Base):
    """Note: The single-start-node invariant per workflow is enforced at the
    application layer (workflow_service). For stronger guarantees, add a
    partial unique index: CREATE UNIQUE INDEX uq_workflow_start
    ON agent_nodes(workflow_id) WHERE is_start = 1;
    This requires a migration framework (e.g., Alembic).
    """
    __tablename__ = "agent_nodes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), default="gemini-2.5-flash")
    tools: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)
    is_start: Mapped[bool] = mapped_column(Boolean, default=False)

    workflow = relationship("Workflow", back_populates="agents")
    outgoing_edges = relationship(
        "Edge",
        foreign_keys="Edge.source_agent_id",
        back_populates="source_agent",
        cascade="save-update, merge",
    )
    incoming_edges = relationship(
        "Edge",
        foreign_keys="Edge.target_agent_id",
        back_populates="target_agent",
        cascade="save-update, merge",
    )
