import type { AgentConfig, AgentRole } from '../types/agent';

export interface NodeTemplate {
  type: 'agent';
  data: Omit<AgentConfig, 'id' | 'status'>;
}

export const AGENT_TEMPLATES: { label: string; role: AgentRole; prompt: string }[] = [
  {
    label: 'Planner',
    role: 'planner',
    prompt: 'You are a planning agent. Break down the user request into clear, actionable steps.',
  },
  {
    label: 'Researcher',
    role: 'researcher',
    prompt: 'You are a research agent. Gather relevant information and facts about the topic.',
  },
  {
    label: 'Writer',
    role: 'writer',
    prompt: 'You are a writer agent. Create clear, well-structured content based on the provided information.',
  },
  {
    label: 'Reviewer',
    role: 'reviewer',
    prompt: 'You are a review agent. Critique and improve the content for accuracy, clarity, and completeness.',
  },
  {
    label: 'Coder',
    role: 'coder',
    prompt: 'You are a coding agent. Write clean, efficient code based on the requirements.',
  },
];
