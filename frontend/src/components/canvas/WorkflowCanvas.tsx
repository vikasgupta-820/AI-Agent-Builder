import { useCallback, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore, type WorkflowNode } from '../../stores/useWorkflowStore';
import { useUIStore } from '../../stores/useUIStore';
import { AgentNode } from '../nodes/AgentNode';
import { NodePalette } from '../palette/NodePalette';
import { ConfigPanel } from '../config-panel/ConfigPanel';
import type { AgentConfig, AgentRole } from '../../types/agent';

const nodeTypes: NodeTypes = {
  agentNode: AgentNode,
};

function CanvasInner() {
  const { screenToFlowPosition } = useReactFlow();
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const selectNode = useUIStore((s) => s.selectNode);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => selectNode(node.id),
    [selectNode]
  );

  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      let template: { role: AgentRole; name: string; prompt: string };
      try {
        template = JSON.parse(type);
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = crypto.randomUUID();
      const newNode: WorkflowNode = {
        id,
        type: 'agentNode',
        position,
        data: {
          id,
          name: template.name,
          role: template.role,
          systemPrompt: template.prompt,
          model: 'gemini-2.5-flash',
          tools: [] as string[],
          isStart: false,
          status: 'idle' as const,
        } satisfies AgentConfig,
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  return (
    <div className="flex h-full">
      <NodePalette />

      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <Background color="#2e3040" gap={20} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#4a4d60"
            maskColor="rgba(15, 17, 23, 0.8)"
          />
        </ReactFlow>
      </div>

      <ConfigPanel />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
