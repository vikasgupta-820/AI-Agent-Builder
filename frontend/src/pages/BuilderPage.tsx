import { useState, useEffect, useCallback, useRef } from 'react';
import { WorkflowCanvas } from '../components/canvas/WorkflowCanvas';
import { ExecutionPanel } from '../components/execution/ExecutionPanel';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { workflowService } from '../services/workflowService';
import { workflowToNodes, workflowToEdges, nodeToAgentApi } from '../utils/serialization';

export function BuilderPage() {
  const workflowId = useWorkflowStore((s) => s.workflowId);
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const setWorkflow = useWorkflowStore((s) => s.setWorkflow);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const markClean = useWorkflowStore((s) => s.markClean);
  const resetStore = useWorkflowStore((s) => s.resetStore);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track the current workflow ID from the URL hash
  const [currentHashId, setCurrentHashId] = useState<string | null>(() => {
    const match = window.location.hash.match(/\/builder\/(.+)/);
    return match ? match[1] : null;
  });

  // Listen for hash changes to reload workflow when navigating between workflows
  useEffect(() => {
    const handler = () => {
      const match = window.location.hash.match(/\/builder\/(.+)/);
      const newId = match ? match[1] : null;
      setCurrentHashId(newId);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Load workflow when hash ID changes
  useEffect(() => {
    if (currentHashId) {
      workflowService.getWorkflow(currentHashId).then((wf) => {
        setWorkflow(wf.id, wf.name, wf.description, workflowToNodes(wf), workflowToEdges(wf));
      }).catch(() => {
        resetStore();
      });
    } else {
      resetStore();
    }
  }, [currentHashId, setWorkflow, resetStore]);

  // Auto-save on Ctrl+S
  const handleSave = useCallback(async () => {
    // Read fresh state from store to avoid stale closure
    const { workflowId, workflowName, nodes, edges, isDirty } = useWorkflowStore.getState();
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);

    try {
      if (workflowId) {
        // Update existing workflow
        await workflowService.updateWorkflow(workflowId, { name: workflowName });

        // Sync agents: fetch current, diff, then apply changes
        const currentWf = await workflowService.getWorkflow(workflowId);
        const currentAgentIds = new Set(currentWf.agents.map((a) => a.id));
        const newAgentIds = new Set(nodes.map((n) => n.id).filter((id) => currentAgentIds.has(id)));

        // Delete agents that no longer exist
        for (const agent of currentWf.agents) {
          if (!newAgentIds.has(agent.id)) {
            await workflowService.deleteAgent(workflowId, agent.id);
          }
        }

        // Create or update agents
        const agentIdMap: Record<string, string> = {};
        for (const node of nodes) {
          if (currentAgentIds.has(node.id)) {
            // Existing agent — reuse ID
            agentIdMap[node.id] = node.id;
          } else {
            // New agent — create
            const agent = await workflowService.createAgent(workflowId, nodeToAgentApi(node));
            agentIdMap[node.id] = agent.id;
          }
        }

        // Delete all existing edges and recreate (edges are cheap)
        for (const edge of currentWf.edges) {
          await workflowService.deleteEdge(workflowId, edge.id);
        }

        // Recreate edges
        for (const edge of edges) {
          const sourceId = agentIdMap[edge.source] ?? edge.source;
          const targetId = agentIdMap[edge.target] ?? edge.target;
          if (sourceId && targetId) {
            await workflowService.createEdge(workflowId, sourceId, targetId, typeof edge.label === 'string' ? edge.label : undefined);
          }
        }

        // Reload full workflow
        const updated = await workflowService.getWorkflow(workflowId);
        setWorkflow(updated.id, updated.name, updated.description, workflowToNodes(updated), workflowToEdges(updated));
        markClean();
      } else {
        // Create new workflow
        const wf = await workflowService.createWorkflow(workflowName, '');

        // Create agents
        const agentIdMap: Record<string, string> = {};
        for (const node of nodes) {
          const agent = await workflowService.createAgent(wf.id, nodeToAgentApi(node));
          agentIdMap[node.id] = agent.id;
        }

        // Create edges
        for (const edge of edges) {
          const sourceId = agentIdMap[edge.source] ?? edge.source;
          const targetId = agentIdMap[edge.target] ?? edge.target;
          if (sourceId && targetId) {
            await workflowService.createEdge(wf.id, sourceId, targetId, typeof edge.label === 'string' ? edge.label : undefined);
          }
        }

        // Reload and update URL
        const created = await workflowService.getWorkflow(wf.id);
        setWorkflow(created.id, created.name, created.description, workflowToNodes(created), workflowToEdges(created));
        window.location.hash = `#/builder/${wf.id}`;
        markClean();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Save failed';
      console.error('Save failed:', err);
      setSaveError(message);
      // Clear error after 5 seconds
      if (saveErrorTimerRef.current) clearTimeout(saveErrorTimerRef.current);
      saveErrorTimerRef.current = setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  }, [saving, setWorkflow, markClean]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>
      {saveError && (
        <div
          className="px-4 py-2 text-xs text-red-400 border-t"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          Save failed: {saveError}
        </div>
      )}
      <ExecutionPanel />
    </div>
  );
}
