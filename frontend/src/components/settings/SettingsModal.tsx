import { useState } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';

export function SettingsModal() {
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);
  const apiKey = useSettingsStore((s) => s.geminiApiKey);
  const backendUrl = useSettingsStore((s) => s.backendUrl);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setBackendUrl = useSettingsStore((s) => s.setBackendUrl);

  const [key, setKey] = useState(apiKey);
  const [url, setUrl] = useState(backendUrl);
  const [showKey, setShowKey] = useState(false);

  if (activeModal !== 'settings') return null;

  const handleSave = () => {
    setApiKey(key);
    setBackendUrl(url);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-96 rounded-xl p-6 shadow-2xl"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </h2>

        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-3 py-2 pr-16 rounded-md text-sm border focus:outline-none focus:border-indigo-500"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Stored locally in your browser. Never sent to our servers.
            </p>
          </div>

          {/* Backend URL */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Backend URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm border focus:outline-none focus:border-indigo-500"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={closeModal}
            className="flex-1 py-2 rounded-md text-sm border hover:bg-[var(--color-bg-tertiary)] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-colors"
            style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
