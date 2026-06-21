import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  geminiApiKey: string;
  backendUrl: string;
  setApiKey: (key: string) => void;
  setBackendUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiApiKey: '',
      backendUrl: 'http://localhost:8000',
      setApiKey: (key) => set({ geminiApiKey: key }),
      setBackendUrl: (url) => set({ backendUrl: url }),
    }),
    { name: 'agent-builder-settings' }
  )
);
