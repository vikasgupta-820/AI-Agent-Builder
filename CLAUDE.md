# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Agent Builder — a full-stack application for visually designing and executing multi-agent AI workflows on a canvas. Uses Google Gemini as the LLM backend and LangGraph for graph-based agent orchestration.

## Monorepo Structure

- `backend/` — Python FastAPI + SQLAlchemy + LangGraph
- `frontend/` — React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + ReactFlow

## Common Commands

### Frontend (run from `frontend/`)

```bash
npm run dev        # Start dev server on port 3000 (proxies /api to localhost:8000)
npm run build      # TypeScript check + Vite production build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (run from `backend/`, activate venv first)

```bash
# Windows
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000

# Environment variables — copy .env.example to .env
# Required: DEFAULT_GEMINI_API_KEY
# Optional: DATABASE_URL (defaults to SQLite), CORS_ORIGINS, LOG_LEVEL
```

No test framework is configured in either frontend or backend.

## Architecture

### Backend Layers

- **`app/api/v1/`** — FastAPI route handlers (agents, edges, workflows, conversations, WebSocket execution)
- **`app/services/`** — Business logic (`workflow_service`, `execution_service`, `conversation_service`)
- **`app/models/`** — SQLAlchemy ORM models (workflows, agent_nodes, edges, conversations+messages)
- **`app/schemas/`** — Pydantic request/response schemas
- **`app/graph/`** — LangGraph engine:
  - `builder.py` — `GraphBuilder.build()` validates connectivity (BFS from start node), constructs a `StateGraph`, compiles it
  - `nodes.py` — `NodeFactory.create_agent_node()` creates async callables with tool-calling loop (max 5 iterations, 3 retries w/ exponential backoff)
  - `state.py` — `WorkflowState` TypedDict (messages + current_agent)
  - `tools/` — Built-in tools (`calculator`, `web_search`) registered in `TOOL_REGISTRY`
- **`app/core/`** — Database engine (async SQLite via aiosqlite) and Pydantic Settings config

### Frontend Layers

- **`pages/`** — Two routes: `BuilderPage` (canvas + execution) and `WorkflowsPage` (list/CRUD), hash-based routing (`#/builder`, `#/workflows`, `#/builder/:id`)
- **`stores/`** — Zustand stores: `useWorkflowStore` (nodes/edges/CRUD), `useExecutionStore`, `useUIStore`, `useSettingsStore`
- **`services/`** — `api.ts` (Axios instance with API key interceptor), `workflowService.ts` (REST calls), `websocketService.ts` (WebSocket execution streaming)
- **`components/`** — ReactFlow canvas (`WorkflowCanvas`), custom node (`AgentNode`), palette, config panel, execution panel
- **`types/`** — TypeScript interfaces for agents, workflows, execution events
- **`utils/serialization.ts`** — Converts between ReactFlow nodes/edges and API format

### Key Data Flow

1. User drags agent nodes onto the ReactFlow canvas and connects them with edges
2. Frontend serializes the graph and POSTs to `/api/v1/workflows/` (Ctrl+S to save)
3. Execution starts via WebSocket at `ws/execute/{workflow_id}`
4. Backend loads the workflow, builds a LangGraph `StateGraph` via `GraphBuilder`, and streams execution events (`node_start`, `tool_call`, `node_output`, `execution_complete`, `error`)
5. Frontend receives events over WebSocket and updates the execution panel in real-time

### LLM Configuration

- Model defaults to `gemini-2.5-flash` (configurable per agent in the frontend settings)
- API key is sent from frontend via `X-API-Key` header, falls back to server-side `DEFAULT_GEMINI_API_KEY` env var
