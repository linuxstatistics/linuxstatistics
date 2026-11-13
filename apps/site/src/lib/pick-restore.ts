/** Show the picker hidden by PickRestore.astro, once the island has rendered its restored state. */
export function revealPicker() {
  document.documentElement.removeAttribute("data-pick-restore");
}
