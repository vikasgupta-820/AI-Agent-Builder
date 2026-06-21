import uuid
from typing import Optional

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Edge(Base):
    __tablename__ = "edges"
    __table_args__ = (
        UniqueConstraint("source_agent_id", "target_agent_id", name="uq_edge_pair"),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    workflow_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False
    )
    source_agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_nodes.id", ondelete="CASCADE"), nullable=False
    )
    target_agent_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("agent_nodes.id", ondelete="CASCADE"), nullable=False
    )
    condition: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    workflow = relationship("Workflow", back_populates="edges")
    source_agent = relationship("AgentNode", foreign_keys=[source_agent_id], back_populates="outgoing_edges")
    target_agent = relationship("AgentNode", foreign_keys=[target_agent_id], back_populates="incoming_edges")
