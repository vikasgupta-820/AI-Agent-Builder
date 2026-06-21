import { useState, useEffect } from 'react';
import { workflowService } from '../services/workflowService';
import type { WorkflowListItem } from '../types/workflow';

export function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  const fetchWorkflows = async () => {
    try {
      const list = await workflowService.listWorkflows();
      setWorkflows(list);
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const wf = await workflowService.createWorkflow(newName, '');
      window.location.hash = `#/builder/${wf.id}`;
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await workflowService.deleteWorkflow(id);
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            My Workflows
          </h1>
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            + New Workflow
          </button>
        </div>

        {/* New workflow input */}
        {showNew && (
          <div
            className="mb-6 p-4 rounded-lg flex gap-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workflow name..."
              className="flex-1 px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-indigo-500"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              Create
            </button>
            <button
              onClick={() => { setShowNew(false); setNewName(''); }}
              className="px-4 py-2 rounded-md text-sm border hover:bg-[var(--color-bg-tertiary)] transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
            Loading workflows...
          </p>
        )}

        {/* Empty state */}
        {!loading && workflows.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 opacity-30">&#9881;</div>
            <p className="text-lg mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              No workflows yet
            </p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              Create your first agent workflow to get started.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              Create Workflow
            </button>
          </div>
        )}

        {/* Workflow grid */}
        {!loading && workflows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="rounded-lg p-4 transition-colors hover:border-indigo-500/50"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
              >
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  {wf.name}
                </h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
                  {wf.description || 'No description'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(wf.updated_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <a
                      href={`#/builder/${wf.id}`}
                      className="px-3 py-1 rounded text-xs font-medium transition-colors"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                    >
                      Open
                    </a>
                    <button
                      onClick={() => handleDelete(wf.id)}
                      className="px-3 py-1 rounded text-xs border hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 transition-colors"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
