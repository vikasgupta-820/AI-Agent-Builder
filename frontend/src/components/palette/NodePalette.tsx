import { AGENT_TEMPLATES } from '../../constants/nodeDefaults';
import { useUIStore } from '../../stores/useUIStore';
import type { DragEvent } from 'react';

export function NodePalette() {
  const isPaletteOpen = useUIStore((s) => s.isPaletteOpen);

  const onDragStart = (
    event: DragEvent,
    template: { role: string; name: string; prompt: string }
  ) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify(template)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  if (!isPaletteOpen) return null;

  return (
    <div className="w-60 h-full border-r flex flex-col" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Agent Templates
        </h2>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          Drag an agent onto the canvas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {AGENT_TEMPLATES.map((template) => (
          <div
            key={template.role}
            draggable
            onDragStart={(e) => onDragStart(e, { role: template.role, name: template.label, prompt: template.prompt })}
            className="p-3 rounded-lg cursor-grab active:cursor-grabbing transition-colors hover:bg-[var(--color-bg-tertiary)]"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {template.label}
            </div>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {template.prompt}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
