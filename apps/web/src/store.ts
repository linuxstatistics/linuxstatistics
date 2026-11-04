import { create } from "zustand";

interface AppState {
  selectedSlug: string | null;
  setSelected: (slug: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedSlug: null,
  setSelected: (selectedSlug) => set({ selectedSlug }),
}));
