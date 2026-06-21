import { useUIStore } from '../../stores/useUIStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';
import { AVAILABLE_TOOLS } from '../../constants/tools';
import { ROLE_LABELS, type AgentRole, type AgentConfig } from '../../types/agent';

export function ConfigPanel() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const isConfigPanelOpen = useUIStore((s) => s.isConfigPanelOpen);
  const nodes = useWorkflowStore((s) => s.nodes);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const removeNode = useWorkflowStore((s) => s.removeNode);
  const selectNode = useUIStore((s) => s.selectNode);

  if (!isConfigPanelOpen || !selectedNodeId) return null;

  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as AgentConfig;

  const update = (patch: Partial<AgentConfig>) => {
    updateNodeData(selectedNodeId, patch);
  };

  const handleToolToggle = (toolId: string) => {
    const tools = data.tools.includes(toolId)
      ? data.tools.filter((t) => t !== toolId)
      : [...data.tools, toolId];
    update({ tools });
  };

  const handleDelete = () => {
    removeNode(selectedNodeId);
    selectNode(null);
  };

  return (
    <div
      className="w-72 h-full border-l overflow-y-auto flex flex-col"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Agent Config
        </h2>
        <button
          onClick={() => selectNode(null)}
          className="text-gray-400 hover:text-white text-lg leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-indigo-500"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Role
          </label>
          <select
            value={data.role}
            onChange={(e) => update({ role: e.target.value as AgentRole })}
            className="w-full px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-indigo-500"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            System Prompt
          </label>
          <textarea
            value={data.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            rows={5}
            className="w-full px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-indigo-500 resize-none font-mono"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Start Node */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isStart"
            checked={data.isStart}
            onChange={(e) => update({ isStart: e.target.checked })}
            className="rounded border-gray-600"
          />
          <label htmlFor="isStart" className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Entry point (start node)
          </label>
        </div>

        {/* Tools */}
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Tools
          </label>
          <div className="space-y-1.5">
            {AVAILABLE_TOOLS.map((tool) => (
              <label
                key={tool.id}
                className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[var(--color-bg-tertiary)]"
              >
                <input
                  type="checkbox"
                  checked={data.tools.includes(tool.id)}
                  onChange={() => handleToolToggle(tool.id)}
                  className="rounded border-gray-600"
                />
                <div>
                  <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {tool.name}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {tool.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-full py-2 rounded-md text-sm font-medium bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors border border-red-900/50"
        >
          Delete Agent
        </button>
      </div>
    </div>
  );
}
