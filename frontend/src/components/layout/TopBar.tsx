import { useUIStore } from '../../stores/useUIStore';
import { useWorkflowStore } from '../../stores/useWorkflowStore';

export function TopBar() {
  const workflowName = useWorkflowStore((s) => s.workflowName);
  const isDirty = useWorkflowStore((s) => s.isDirty);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const openModal = useUIStore((s) => s.openModal);
  const togglePalette = useUIStore((s) => s.togglePalette);

  const currentPage = window.location.hash.includes('/workflows') ? 'workflows' : 'builder';

  return (
    <div
      className="h-12 flex items-center justify-between px-4 border-b shrink-0"
      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePalette}
          className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Toggle palette"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="h-5 w-px" style={{ backgroundColor: 'var(--color-border)' }} />

        {currentPage === 'builder' ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 py-0.5"
              style={{ color: 'var(--color-text-primary)', width: 200 }}
            />
            {isDirty && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-warning)', color: '#000' }}>
                unsaved
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Workflows
          </span>
        )}
      </div>

      {/* Center - Nav */}
      <nav className="flex items-center gap-1">
        <a
          href="#/builder"
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            currentPage === 'builder' ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-[var(--color-bg-tertiary)]'
          }`}
          style={currentPage !== 'builder' ? { color: 'var(--color-text-secondary)' } : {}}
        >
          Builder
        </a>
        <a
          href="#/workflows"
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            currentPage === 'workflows' ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-[var(--color-bg-tertiary)]'
          }`}
          style={currentPage !== 'workflows' ? { color: 'var(--color-text-secondary)' } : {}}
        >
          Workflows
        </a>
      </nav>

      {/* Right */}
      <button
        onClick={() => openModal('settings')}
        className="p-1.5 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
        title="Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </button>
    </div>
  );
}
