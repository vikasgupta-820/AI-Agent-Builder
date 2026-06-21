import { create } from 'zustand';

type ModalType = 'settings' | 'newWorkflow' | 'deleteConfirm' | null;

interface UIState {
  selectedNodeId: string | null;
  isPaletteOpen: boolean;
  isConfigPanelOpen: boolean;
  isExecutionPanelOpen: boolean;
  activeModal: ModalType;
  modalPayload: unknown;

  selectNode: (nodeId: string | null) => void;
  togglePalette: () => void;
  toggleConfigPanel: () => void;
  toggleExecutionPanel: () => void;
  openModal: (modal: ModalType, payload?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedNodeId: null,
  isPaletteOpen: true,
  isConfigPanelOpen: false,
  isExecutionPanelOpen: true,
  activeModal: null,
  modalPayload: null,

  selectNode: (nodeId) =>
    set({
      selectedNodeId: nodeId,
      isConfigPanelOpen: nodeId !== null,
    }),

  togglePalette: () => set((s) => ({ isPaletteOpen: !s.isPaletteOpen })),
  toggleConfigPanel: () => set((s) => ({ isConfigPanelOpen: !s.isConfigPanelOpen })),
  toggleExecutionPanel: () => set((s) => ({ isExecutionPanelOpen: !s.isExecutionPanelOpen })),

  openModal: (modal, payload = null) => set({ activeModal: modal, modalPayload: payload }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),
}));
