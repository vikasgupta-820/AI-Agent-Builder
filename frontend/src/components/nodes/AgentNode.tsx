import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AgentConfig } from '../../types/agent';
import { ROLE_COLORS, ROLE_LABELS } from '../../types/agent';

export function AgentNode({ data, selected }: NodeProps<AgentConfig>) {
  const config = data;
  const borderColor = ROLE_COLORS[config.role] || ROLE_COLORS.custom;

  const statusClasses: Record<string, string> = {
    idle: 'border-gray-700',
    running: 'border-yellow-400 animate-pulse-border',
    completed: 'border-green-500',
    error: 'border-red-500',
  };

  return (
    <div
      className={`rounded-lg border-l-4 ${selected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--color-bg-primary)]' : ''} ${statusClasses[config.status]}`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        width: 280,
        border: `1px solid ${selected ? '#6366f1' : 'var(--color-border)'}`,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-[var(--color-bg-tertiary)] !border-[var(--color-border)]"
      />

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${borderColor}20`,
              color: borderColor,
            }}
          >
            {ROLE_LABELS[config.role] || config.role}
          </span>
          {config.isStart && (
            <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded">
              START
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-white mb-1 truncate">
          {config.name}
        </h3>

        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
          {config.systemPrompt}
        </p>

        {config.tools.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {config.tools.map((tool) => (
              <span
                key={tool}
                className="text-[10px] bg-gray-700/50 text-gray-300 px-1.5 py-0.5 rounded"
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-[var(--color-bg-tertiary)] !border-[var(--color-border)]"
      />
    </div>
  );
}
