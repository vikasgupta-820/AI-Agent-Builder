import { create } from 'zustand';
import type { ExecutionStatus, LogEntry } from '../types/execution';

interface ExecutionState {
  status: ExecutionStatus;
  logs: LogEntry[];
  currentAgentName: string | null;
  finalOutput: string | null;
  error: string | null;
  conversationId: string | null;

  startExecution: () => void;
  appendLog: (entry: LogEntry) => void;
  setCurrentAgent: (name: string | null) => void;
  setFinalOutput: (output: string) => void;
  setError: (error: string) => void;
  completeExecution: (output: string, conversationId: string) => void;
  failExecution: (error: string) => void;
  clearLogs: () => void;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  status: 'idle',
  logs: [],
  currentAgentName: null,
  finalOutput: null,
  error: null,
  conversationId: null,

  startExecution: () =>
    set({
      status: 'running',
      logs: [],
      currentAgentName: null,
      finalOutput: null,
      error: null,
    }),

  appendLog: (entry) =>
    set((state) => ({ logs: [...state.logs, entry] })),

  setCurrentAgent: (name) => set({ currentAgentName: name }),

  setFinalOutput: (output) => set({ finalOutput: output }),

  setError: (error) => set({ error }),

  completeExecution: (output, conversationId) =>
    set({
      status: 'completed',
      finalOutput: output,
      conversationId,
      currentAgentName: null,
    }),

  failExecution: (error) =>
    set({
      status: 'error',
      error,
      currentAgentName: null,
    }),

  clearLogs: () => set({ logs: [] }),

  resetExecution: () =>
    set({
      status: 'idle',
      logs: [],
      currentAgentName: null,
      finalOutput: null,
      error: null,
      conversationId: null,
    }),
}));
