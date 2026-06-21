from fastapi import APIRouter

from app.api.v1.workflows import router as workflows_router
from app.api.v1.agents import router as agents_router
from app.api.v1.edges import router as edges_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.ws import router as ws_router

router = APIRouter(prefix="/api/v1")

router.include_router(workflows_router)
router.include_router(agents_router)
router.include_router(edges_router)
router.include_router(conversations_router)
router.include_router(ws_router)
