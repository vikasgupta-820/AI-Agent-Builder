export type AgentRole =
  | 'planner'
  | 'researcher'
  | 'writer'
  | 'reviewer'
  | 'coder'
  | 'custom';

export interface AgentConfig {
  [key: string]: unknown;
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  model: string;
  tools: string[];
  isStart: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
}

export const ROLE_COLORS: Record<AgentRole, string> = {
  planner: '#ef4444',
  researcher: '#3b82f6',
  writer: '#a855f7',
  reviewer: '#f59e0b',
  coder: '#22c55e',
  custom: '#64748b',
};

export const ROLE_LABELS: Record<AgentRole, string> = {
  planner: 'Planner',
  researcher: 'Researcher',
  writer: 'Writer',
  reviewer: 'Reviewer',
  coder: 'Coder',
  custom: 'Custom',
};

export interface Tool {
  id: string;
  name: string;
  description: string;
}
