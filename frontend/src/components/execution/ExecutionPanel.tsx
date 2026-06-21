import { useState, useRef, useEffect } from 'react';
import { useExecutionStore } from '../../stores/useExecutionStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';
import { wsService } from '../../services/websocketService';
import { OutputPanel } from '../output/OutputPanel';
import type { WSMessage } from '../../types/execution';

export function ExecutionPanel() {
  const [query, setQuery] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const isOpen = useUIStore((s) => s.isExecutionPanelOpen);
  const togglePanel = useUIStore((s) => s.toggleExecutionPanel);

  const status = useExecutionStore((s) => s.status);
  const logs = useExecutionStore((s) => s.logs);
  const finalOutput = useExecutionStore((s) => s.finalOutput);
  const error = useExecutionStore((s) => s.error);
  const startExecution = useExecutionStore((s) => s.startExecution);
  const appendLog = useExecutionStore((s) => s.appendLog);
  const setCurrentAgent = useExecutionStore((s) => s.setCurrentAgent);
  const completeExecution = useExecutionStore((s) => s.completeExecution);
  const failExecution = useExecutionStore((s) => s.failExecution);

  const workflowId = useWorkflowStore((s) => s.workflowId);
  const apiKey = useSettingsStore((s) => s.geminiApiKey);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      wsService.disconnect();
    };
  }, []);

  const handleRun = () => {
    if (!query.trim() || status === 'running') return;

    if (!workflowId) {
      appendLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentName: 'System',
        level: 'error',
        message: 'Please save the workflow first (Ctrl+S) before running.',
      });
      return;
    }

    if (!apiKey) {
      appendLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentName: 'System',
        level: 'error',
        message: 'No Gemini API key configured. Open Settings to add one.',
      });
      return;
    }

    startExecution();

    // Reset all node statuses — read from store directly to avoid stale closure
    const currentNodes = useWorkflowStore.getState().nodes;
    currentNodes.forEach((n) => useWorkflowStore.getState().setNodeStatus(n.id, 'idle'));

    wsService.connect(workflowId, query, apiKey, undefined, {
      onMessage: (msg: WSMessage) => {
        const now = new Date().toISOString();

        switch (msg.type) {
          case 'node_start':
            setCurrentAgent(msg.agent_name ?? null);
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: msg.agent_name ?? 'Unknown',
              level: 'info',
              message: `Starting...`,
            });
            // Set node status to running — read fresh from store
            {
              const node = useWorkflowStore.getState().nodes.find((n) => n.data.name === msg.agent_name);
              if (node) useWorkflowStore.getState().setNodeStatus(node.id, 'running');
            }
            break;

          case 'tool_call':
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: msg.agent_name ?? msg.tool_name ?? 'Tool',
              level: 'debug',
              message: `Tool: ${msg.tool_name ?? 'unknown'}${msg.tool_output ? ` -> ${msg.tool_output}` : ''}`,
            });
            break;

          case 'tool_result':
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: msg.tool_name ?? 'Tool',
              level: 'debug',
              message: `Result: ${msg.tool_output ?? ''}`.substring(0, 200),
            });
            break;

          case 'node_output':
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: msg.agent_name ?? 'Unknown',
              level: 'info',
              message: msg.content ? msg.content.substring(0, 200) : 'Completed',
            });
            // Set node status to completed — read fresh from store
            {
              const node = useWorkflowStore.getState().nodes.find((n) => n.data.name === msg.agent_name);
              if (node) useWorkflowStore.getState().setNodeStatus(node.id, 'completed');
            }
            break;

          case 'execution_complete':
            completeExecution(msg.final_output ?? '', msg.conversation_id ?? '');
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: 'System',
              level: 'info',
              message: 'Execution complete',
            });
            break;

          case 'error':
            failExecution(msg.message ?? 'Unknown error');
            appendLog({
              id: crypto.randomUUID(),
              timestamp: now,
              agentName: 'System',
              level: 'error',
              message: msg.message ?? 'Unknown error',
            });
            break;
        }
      },
      onClose: () => {
        if (useExecutionStore.getState().status === 'running') {
          failExecution('WebSocket connection closed unexpectedly');
        }
      },
      onError: (err) => {
        failExecution(err);
      },
    });
  };

  const levelColors: Record<string, string> = {
    info: 'text-blue-400',
    debug: 'text-gray-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <div
      className="border-t flex flex-col"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        height: isOpen ? 260 : 36,
        transition: 'height 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header / toggle */}
      <button
        onClick={togglePanel}
        className="flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-[var(--color-bg-tertiary)] transition-colors shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span>
          Execution Panel
          {status === 'running' && (
            <span className="ml-2 text-yellow-400 animate-pulse">Running...</span>
          )}
        </span>
        <span>{isOpen ? '▼' : '▲'}</span>
      </button>

      {isOpen && (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Query input + run */}
          <div className="w-80 p-3 border-r flex flex-col gap-2" style={{ borderColor: 'var(--color-border)' }}>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your query..."
              rows={4}
              className="flex-1 px-3 py-2 rounded-md text-sm border resize-none focus:outline-none focus:border-indigo-500"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleRun();
              }}
            />
            <button
              onClick={handleRun}
              disabled={status === 'running' || !query.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: status === 'running' ? 'var(--color-bg-tertiary)' : 'var(--color-accent)',
                color: 'white',
              }}
            >
              {status === 'running' ? 'Running...' : 'Run Workflow'}
            </button>
          </div>

          {/* Right: Logs + output */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Logs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
              {logs.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)' }}>
                  Logs will appear here when you run the workflow.
                </p>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-600 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className="shrink-0 px-1.5 rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      color: log.level === 'error' ? '#ef4444' : '#818cf8',
                    }}
                  >
                    {log.agentName}
                  </span>
                  <span className={levelColors[log.level] ?? ''}>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            {/* Final output preview + view button */}
            {finalOutput && status === 'completed' && (
              <div
                className="border-t p-3 flex items-center justify-between gap-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-xs truncate flex-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {finalOutput.substring(0, 120)}...
                </p>
                <OutputPanel />
              </div>
            )}

            {error && (
              <div
                className="border-t p-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
