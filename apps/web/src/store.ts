import { create } from "zustand";

export type View = "galaxy" | "list";

interface AppState {
  view: View;
  selectedSlug: string | null;
  setView: (view: View) => void;
  setSelected: (slug: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  view: "galaxy",
  selectedSlug: null,
  // Switching views always dismisses any open detail panel.
  setView: (view) => set({ view, selectedSlug: null }),
  setSelected: (selectedSlug) => set({ selectedSlug }),
}));
