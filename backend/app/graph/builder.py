from collections import deque

from langgraph.graph import END, StateGraph

from app.graph.nodes import NodeFactory
from app.graph.state import WorkflowState
from app.models.agent import AgentNode
from app.models.edge import Edge
from app.utils.logging import get_logger

logger = get_logger(__name__)


class WorkflowValidationError(Exception):
    pass


class GraphBuilder:
    @staticmethod
    def validate(agents: list[AgentNode], edges: list[Edge]) -> None:
        """Validate the workflow graph structure before building."""
        if not agents:
            raise WorkflowValidationError("Workflow must have at least one agent")

        # Check for exactly one start node
        start_nodes = [a for a in agents if a.is_start]
        if not start_nodes:
            raise WorkflowValidationError(
                "Workflow must have exactly one agent marked as start (is_start=True)"
            )

        # Build adjacency and check connectivity via BFS
        agent_ids = {a.id for a in agents}
        agent_id_to_name = {a.id: a.name for a in agents}
        adjacency: dict[str, list[str]] = {a.id: [] for a in agents}

        for edge in edges:
            if edge.source_agent_id not in agent_ids:
                raise WorkflowValidationError(
                    f"Edge references non-existent source agent: {edge.source_agent_id}"
                )
            if edge.target_agent_id not in agent_ids:
                raise WorkflowValidationError(
                    f"Edge references non-existent target agent: {edge.target_agent_id}"
                )
            adjacency[edge.source_agent_id].append(edge.target_agent_id)

        # BFS from start node
        start_id = start_nodes[0].id
        visited = set()
        queue = deque([start_id])
        while queue:
            current = queue.popleft()
            if current in visited:
                continue
            visited.add(current)
            for neighbor in adjacency.get(current, []):
                if neighbor not in visited:
                    queue.append(neighbor)

        unreachable = agent_ids - visited
        if unreachable:
            names = [agent_id_to_name[aid] for aid in unreachable]
            raise WorkflowValidationError(
                f"Agents not reachable from start: {', '.join(names)}"
            )

    @staticmethod
    def build(
        agents: list[AgentNode],
        edges: list[Edge],
        gemini_api_key: str,
    ):
        """Build a compiled LangGraph StateGraph from workflow definition."""
        GraphBuilder.validate(agents, edges)

        graph = StateGraph(WorkflowState)
        agent_id_to_name = {a.id: a.name for a in agents}

        # Add nodes
        for agent in agents:
            node_fn = NodeFactory.create_agent_node(agent, gemini_api_key)
            graph.add_node(agent.name, node_fn)
            logger.info(f"Added node: {agent.name}")

        # Find start node
        start_agent = next(a for a in agents if a.is_start)
        graph.set_entry_point(start_agent.name)
        logger.info(f"Entry point: {start_agent.name}")

        # Add edges
        # Build adjacency: source_name -> [target_names]
        adjacency: dict[str, list[str]] = {a.name: [] for a in agents}
        for edge in edges:
            source_name = agent_id_to_name[edge.source_agent_id]
            target_name = agent_id_to_name[edge.target_agent_id]
            adjacency[source_name].append(target_name)

        for source_name, target_names in adjacency.items():
            if not target_names:
                # Terminal node -> END
                graph.add_edge(source_name, END)
                logger.info(f"Edge: {source_name} -> END")
            elif len(target_names) == 1:
                graph.add_edge(source_name, target_names[0])
                logger.info(f"Edge: {source_name} -> {target_names[0]}")
            else:
                # Multiple targets: use conditional edges to route sequentially.
                # LangGraph's add_edge with same source creates parallel fan-out,
                # which causes nondeterministic current_agent state. Instead, we
                # use a conditional edge that routes through targets one at a time.
                def _make_router(targets: list[str]):
                    """Create a router that sequences through targets using closure state."""
                    remaining = list(targets)

                    def router(state: WorkflowState) -> str:
                        if remaining:
                            return remaining.pop(0)
                        return "__end__"

                    return router

                router = _make_router(target_names)
                route_map = {name: name for name in target_names}
                route_map["__end__"] = END
                graph.add_conditional_edges(source_name, router, route_map)
                logger.info(
                    f"Conditional edges: {source_name} -> {target_names} (sequential)"
                )

        compiled = graph.compile()
        logger.info("Graph compiled successfully")
        return compiled
