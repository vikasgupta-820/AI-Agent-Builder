import type { Node, Edge } from '@xyflow/react';
import type { AgentConfig } from './agent';

export type WorkflowNode = Node<AgentConfig>;
export type WorkflowEdge = Edge;

export interface Workflow {
  id: string;
  name: string;
  description: string;
  agents: AgentApiData[];
  edges: EdgeApiData[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface AgentApiData {
  id: string;
  workflow_id: string;
  name: string;
  system_prompt: string;
  role: string;
  model: string;
  tools: string[] | null;
  position_x: number;
  position_y: number;
  is_start: boolean;
}

export interface EdgeApiData {
  id: string;
  workflow_id: string;
  source_agent_id: string;
  target_agent_id: string;
  condition: string | null;
  label: string | null;
}
