import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  editMode: boolean;
  expandedTicker: string | null;
  toggleSidebar: () => void;
  setEditMode: (v: boolean) => void;
  setExpandedTicker: (symbol: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  editMode: false,
  expandedTicker: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setEditMode: (v) => set({ editMode: v }),
  setExpandedTicker: (symbol) => set((s) => ({ expandedTicker: s.expandedTicker === symbol ? null : symbol })),
}));
