import type { Edge } from '@xyflow/react';
import type { WorkflowNode } from '../stores/useWorkflowStore';
import type { Workflow, AgentApiData } from '../types/workflow';
import type { AgentConfig } from '../types/agent';

export function workflowToNodes(workflow: Workflow): WorkflowNode[] {
  return workflow.agents.map((agent) => ({
    id: agent.id,
    type: 'agentNode',
    position: { x: agent.position_x, y: agent.position_y },
    data: {
      id: agent.id,
      name: agent.name,
      role: agent.role as AgentConfig['role'],
      systemPrompt: agent.system_prompt,
      model: agent.model,
      tools: agent.tools ?? [],
      isStart: agent.is_start,
      status: 'idle' as const,
    },
  }));
}

export function workflowToEdges(workflow: Workflow): Edge[] {
  return workflow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source_agent_id,
    target: edge.target_agent_id,
    label: edge.label ?? undefined,
    type: 'default',
    animated: true,
  }));
}

export function nodeToAgentApi(node: WorkflowNode): Omit<AgentApiData, 'id' | 'workflow_id'> {
  return {
    name: node.data.name,
    system_prompt: node.data.systemPrompt,
    role: node.data.role,
    model: node.data.model,
    tools: node.data.tools.length > 0 ? node.data.tools : null,
    position_x: node.position.x,
    position_y: node.position.y,
    is_start: node.data.isStart,
  };
}
