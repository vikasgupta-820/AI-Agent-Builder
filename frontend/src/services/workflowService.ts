import api from './api';
import type { Workflow, WorkflowListItem, AgentApiData, EdgeApiData } from '../types/workflow';

export const workflowService = {
  async listWorkflows(): Promise<WorkflowListItem[]> {
    const { data } = await api.get('/workflows/');
    return data;
  },

  async getWorkflow(id: string): Promise<Workflow> {
    const { data } = await api.get(`/workflows/${id}`);
    return data;
  },

  async createWorkflow(name: string, description: string): Promise<Workflow> {
    const { data } = await api.post('/workflows/', { name, description });
    return data;
  },

  async updateWorkflow(id: string, updates: { name?: string; description?: string }): Promise<Workflow> {
    const { data } = await api.put(`/workflows/${id}`, updates);
    return data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  // Agents
  async createAgent(workflowId: string, agent: Omit<AgentApiData, 'id' | 'workflow_id'>): Promise<AgentApiData> {
    const { data } = await api.post(`/workflows/${workflowId}/agents/`, agent);
    return data;
  },

  async updateAgent(workflowId: string, agentId: string, agent: Partial<AgentApiData>): Promise<AgentApiData> {
    const { data } = await api.put(`/workflows/${workflowId}/agents/${agentId}`, agent);
    return data;
  },

  async deleteAgent(workflowId: string, agentId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/agents/${agentId}`);
  },

  // Edges
  async createEdge(workflowId: string, sourceAgentId: string, targetAgentId: string, label?: string): Promise<EdgeApiData> {
    const { data } = await api.post(`/workflows/${workflowId}/edges/`, {
      source_agent_id: sourceAgentId,
      target_agent_id: targetAgentId,
      label,
    });
    return data;
  },

  async deleteEdge(workflowId: string, edgeId: string): Promise<void> {
    await api.delete(`/workflows/${workflowId}/edges/${edgeId}`);
  },
};
