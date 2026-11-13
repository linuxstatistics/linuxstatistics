import { PROFILES } from "./picker-profiles";

export const BEGINNER_QUESTIONS = [
  { id: "origin", title: "What do you use now?", options: [["windows", "Windows"], ["mac", "Mac"], ["chromeos", "ChromeOS"], ["linux", "Linux"], ["unsure", "Not sure"]] },
  { id: "machine", title: "Which computer will run Linux?", hint: "On a Mac, open Apple menu → About This Mac. Look for Intel or an Apple M-series chip.", options: [["pc", "A regular 64-bit PC"], ["intel-mac", "An Intel Mac"], ["apple", "An Apple Silicon Mac"], ["arm", "Raspberry Pi or another ARM board"], ["pc32", "A very old 32-bit PC"], ["unsure", "Not sure"]] },
  { id: "purpose", title: "What will you mainly use it for?", options: [["everyday", "Web, email and everyday tasks"], ["gaming", "Games"], ["older", "Bringing an older computer back to life"], ["programming", "Programming"], ["work", "Creative work or specialist apps"], ["other", "Something else / not sure"], ["ai", "AI and local LLMs"]] },
  { id: "ram", title: "How much memory does it have?", options: [["1", "Under 2 GB"], ["2", "2–4 GB"], ["4", "4–8 GB"], ["8", "8 GB or more"], ["unsure", "Not sure"]] },
  { id: "gpu", title: "Which graphics does it use?", hint: "Graphics hardware affects gaming images and AI acceleration. The exact model matters, not just the brand.", options: [["amd", "AMD"], ["intel", "Intel"], ["nvidia", "NVIDIA"], ["unsure", "Not sure"]] },
] as const;
export type BeginnerKey = typeof BEGINNER_QUESTIONS[number]["id"];
export type BeginnerAnswers = Partial<Record<BeginnerKey, string>>;
export function beginnerFlow(a: BeginnerAnswers) {
  const blocked = Boolean(a.machine && !["pc", "intel-mac"].includes(a.machine)) || a.origin === "chromeos";
  return BEGINNER_QUESTIONS.filter((q) => q.id === "ram" ? !blocked && a.purpose === "older" : q.id === "gpu" ? !blocked && (a.purpose === "gaming" || a.purpose === "ai") : true);
}
/** Stable display partition; legacy detailed-quiz encoded option positions are untouched. */
export function beginnerOptions(q: typeof BEGINNER_QUESTIONS[number]) {
  return [...q.options].sort((a, b) => Number(["other", "unsure"].includes(a[0])) - Number(["other", "unsure"].includes(b[0])));
}
export function parseBeginner(params: URLSearchParams): BeginnerAnswers {
  if (params.get("v") !== "1") return {};
  const a: BeginnerAnswers = {};
  for (const q of BEGINNER_QUESTIONS) {
    const value = params.get(q.id);
    if (q.options.some(([v]) => v === value)) a[q.id] = value!;
  }
  return pruneBeginner(a);
}
export function pruneBeginner(a: BeginnerAnswers): BeginnerAnswers {
  const out = { ...a };
  if (a.purpose !== "older") delete out.ram;
  if (a.purpose !== "gaming" && a.purpose !== "ai") delete out.gpu;
  if (a.machine && !["pc", "intel-mac"].includes(a.machine) || a.origin === "chromeos") { delete out.gpu; delete out.ram; }
  return out;
}
export function beginnerQuery(a: BeginnerAnswers): string {
  const p = new URLSearchParams({ v: "1" });
  for (const [k, v] of Object.entries(pruneBeginner(a))) if (v) p.set(k, v);
  return p.toString();
}
export function pickerMode(params: URLSearchParams) { return params.has("a") || params.get("mode") === "advanced" ? "advanced" : "beginner"; }

export type BeginnerResult = { kind: "compatibility-check"; title: string; caveat: string; href: string } | { kind: "recommendation"; slug: string; reasons: string[]; caveat: string; alternatives: { slug: string; reason: string }[] };
/** Editorial starting points, independent of rank. Eligibility is not hardware certification. */
export function beginnerRecommendation(a: BeginnerAnswers, tracked: ReadonlySet<string>): BeginnerResult {
  const check = (title: string, caveat: string, href = "/switch/getting-started/#hardware"): BeginnerResult => ({ kind: "compatibility-check", title, caveat, href });
  if (!a.origin || !a.machine || !a.purpose) return check("Check your computer first", "Answer the three core questions before choosing a download.");
  if (a.machine === "apple") return check("Check your Mac with Asahi", "Apple Silicon needs a model-specific installation route. A regular Mint or Fedora PC image is not suitable. Check your exact model and required features.", "https://asahilinux.org/docs/platform/feature-support/overview/");
  if (!["pc", "intel-mac"].includes(a.machine) || a.origin === "chromeos") return check("Check your exact hardware first", "ARM boards, Chromebooks and 32-bit computers need device-specific guidance. If you are unsure, identify the model before downloading an image.");
  if (a.purpose === "older" && (!a.ram || a.ram === "unsure" || Number(a.ram) < 2)) return check("Check memory and hardware requirements", "We don't have enough information for a safe beginner recommendation. Check RAM and the current requirements before choosing a lightweight system.");
  const slug = a.purpose === "gaming" ? "bazzite" : a.purpose === "programming" || a.purpose === "ai" ? "ubuntu" : "mint";
  if (!tracked.has(slug)) return check("Explore the detailed picker", "This starting option is not in the current catalogue. We won't substitute an unrelated distro.", "/pick/?mode=advanced");
  const reasons = slug === "bazzite" ? ["Built around gaming, with Steam tooling ready to use.", "System updates can be rolled back."] : slug === "ubuntu" ? ["A documented starting point for development tools.", "Long-term support releases are available."] : ["A familiar desktop with graphical tools for everyday tasks.", a.purpose === "older" ? "Mint offers a lighter Xfce edition; check its current requirements." : "Mint recommends Cinnamon when you are unsure which edition to choose."];
  const hardwareCaveat = a.machine === "intel-mac" ? "Intel Macs can need model-specific Wi-Fi, camera or other driver work. Check your model before installing. " : "";
  const caveat = hardwareCaveat + (a.purpose === "gaming" ? `Check Bazzite's image picker for ${a.gpu === "unsure" || !a.gpu ? "your graphics hardware (identify it first)" : `${a.gpu.toUpperCase()} and your exact GPU model`}. Anti-cheat can block games; check your essential titles before switching.` : a.purpose === "work" ? "Check your essential apps and file formats first. An alternative may not replace every feature your work requires." : "Check hardware and essential apps, and back up before changing your computer. This is a starting point, not a compatibility guarantee.");
  const alternatives = [{ slug: "zorin", reason: "Another guided desktop option with familiar layouts." }, { slug: "ubuntu", reason: "Consider it if its documentation and development tools fit your needs." }].filter((d) => d.slug !== slug && tracked.has(d.slug) && (a.purpose !== "older" || PROFILES.find((p) => p.key === d.slug)!.minRamGb <= Number(a.ram))).slice(0, 2);
  if (a.purpose === "ai") {
    reasons.splice(0, reasons.length, "Ubuntu provides a documented platform for AI and development tools.", "Long-term support releases are available; choose the release your AI tools support.");
    return { kind: "recommendation", slug, reasons, caveat: a.machine === "intel-mac" ? `${caveat} For AI acceleration, also check your exact GPU, available memory and framework support.` : `Check your exact GPU and available memory before choosing models. ${a.gpu === "nvidia" ? "Verify the CUDA and driver requirements for your tools." : a.gpu === "amd" ? "ROCm supports selected AMD GPUs and OS releases, not every AMD card." : "Do not assume GPU acceleration is supported. Identify the GPU and check your framework; CPU-only inference may be an option."}`, alternatives: [] };
  }
  return { kind: "recommendation", slug, reasons, caveat, alternatives };
}

export const BEGINNER_SOURCES = [
  { name: "Mint editions and architecture", href: "https://linuxmint-installation-guide.readthedocs.io/en/latest/choose.html" },
  { name: "Bazzite installation and hardware guidance", href: "https://docs.bazzite.gg/General/Installation_Guide/" },
  { name: "Ubuntu for developers", href: "https://ubuntu.com/desktop/developers" },
  { name: "Asahi model support", href: "https://asahilinux.org/docs/platform/feature-support/overview/" },
];
export const BEGINNER_REVIEWED = "2026-11-13";
