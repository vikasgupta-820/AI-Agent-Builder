export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  level: 'info' | 'debug' | 'warn' | 'error';
  message: string;
}

export interface WSMessage {
  type: string;
  agent_name?: string;
  content?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  tool_output?: string;
  message?: string;
  final_output?: string;
  conversation_id?: string;
  run_id?: string;
  timestamp?: string;
}
