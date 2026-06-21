from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_async_session
from app.services.conversation_service import ConversationService
from app.services.execution_service import ExecutionService
from app.services.workflow_service import WorkflowService


async def get_db():
    async for session in get_async_session():
        yield session


def get_gemini_api_key(x_gemini_api_key: Optional[str] = Header(None)) -> str:
    """Extract Gemini API key from header or fall back to env default."""
    key = x_gemini_api_key or settings.DEFAULT_GEMINI_API_KEY
    if not key:
        raise HTTPException(
            status_code=401,
            detail="Gemini API key is required. Set it in Settings or via X-Gemini-API-Key header.",
        )
    return key


def get_workflow_service(
    db: AsyncSession = Depends(get_db),
) -> WorkflowService:
    return WorkflowService(db)


def get_conversation_service(
    db: AsyncSession = Depends(get_db),
) -> ConversationService:
    return ConversationService(db)


def get_execution_service(
    db: AsyncSession = Depends(get_db),
    api_key: str = Depends(get_gemini_api_key),
) -> ExecutionService:
    return ExecutionService(
        workflow_service=WorkflowService(db),
        conv_service=ConversationService(db),
        gemini_api_key=api_key,
    )
