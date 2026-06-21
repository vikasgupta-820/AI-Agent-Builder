from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, Message
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    ToolMessage,
)


class ConversationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_conversation(
        self, workflow_id: str, title: str = "New Conversation"
    ) -> Conversation:
        conversation = Conversation(workflow_id=workflow_id, title=title)
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        result = await self.db.execute(
            select(Conversation)
            .where(Conversation.id == conversation_id)
            .options(selectinload(Conversation.messages))
        )
        return result.scalar_one_or_none()

    async def list_conversations(
        self, workflow_id: Optional[str] = None
    ) -> list[Conversation]:
        stmt = select(Conversation).order_by(Conversation.updated_at.desc())
        if workflow_id:
            stmt = stmt.where(Conversation.workflow_id == workflow_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_conversation(self, conversation_id: str) -> bool:
        conv = await self.get_conversation(conversation_id)
        if not conv:
            return False
        await self.db.delete(conv)
        await self.db.commit()
        return True

    async def add_message(
        self,
        conversation_id: str,
        role: str,
        content,
        agent_name: Optional[str] = None,
        tool_calls=None,
        tool_call_id: Optional[str] = None,
    ) -> Message:
        # Normalize content to string (Gemini 2.5+ may return list of text blocks)
        if isinstance(content, list):
            text_parts = []
            for block in content:
                if isinstance(block, dict) and "text" in block:
                    text_parts.append(block["text"])
                elif isinstance(block, str):
                    text_parts.append(block)
            content = "\n".join(text_parts)
        elif not isinstance(content, str):
            content = str(content)

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            agent_name=agent_name,
            tool_calls=tool_calls,
            tool_call_id=tool_call_id,
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_messages(self, conversation_id: str) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        return list(result.scalars().all())

    @staticmethod
    def messages_to_langchain(messages: list[Message]) -> list:
        """Convert DB messages to LangChain message types."""
        lc_messages = []
        for msg in messages:
            if msg.role == "user":
                lc_messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                lc_messages.append(
                    AIMessage(
                        content=msg.content,
                        name=msg.agent_name,
                        tool_calls=msg.tool_calls or [],
                    )
                )
            elif msg.role == "system":
                lc_messages.append(SystemMessage(content=msg.content))
            elif msg.role == "tool":
                lc_messages.append(
                    ToolMessage(
                        content=msg.content,
                        tool_call_id=msg.tool_call_id or "",
                    )
                )
        return lc_messages
