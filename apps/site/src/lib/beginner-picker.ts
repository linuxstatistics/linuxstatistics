import { PROFILES, type Use } from "./picker-profiles";
import { encodeAnswers, type Answers } from "./picker-questions";

export const BEGINNER_QUESTIONS = [
  { id: "origin", title: "What do you use now?", options: [["windows", "Windows"], ["mac", "Mac"], ["linux", "Linux"], ["chromeos", "ChromeOS"], ["unsure", "Not sure"]] },
  { id: "machine", title: "Which computer will run Linux?", hintFor: { mac: "On a Mac, open Apple menu → About This Mac. Look for Intel or an Apple M-series chip.", windows: "On Windows, open Settings → System → About. \"64-bit operating system\" means a regular 64-bit PC.", linux: "On Linux, run `uname -m` in a terminal. `x86_64` means a regular 64-bit PC, `aarch64` means ARM, `i686` means 32‑bit.", unsure: "On Windows, open Settings → System → About and look for \"64-bit operating system\". On a Mac, open Apple menu → About This Mac and look for Intel or an Apple M-series chip." }, options: [["pc", "A regular 64-bit PC"], ["pc32", "A very old 32-bit PC"], ["apple", "An Apple Silicon Mac"], ["intel-mac", "An Intel Mac"], ["arm", "Raspberry Pi or another ARM board"], ["unsure", "Not sure"]] },
  { id: "purpose", title: "What will you mainly use it for?", options: [["everyday", "Web, email and everyday tasks"], ["gaming", "Games"], ["older", "Bringing an older computer back to life"], ["programming", "Programming"], ["work", "Creative work or specialist apps"], ["other", "Something else / not sure"], ["ai", "AI and local LLMs"]] },
  { id: "ram", title: "How much memory does it have?", options: [["1", "Under 2 GB"], ["2", "2–4 GB"], ["4", "4–8 GB"], ["8", "8 GB or more"], ["unsure", "Not sure"]] },
  { id: "gpu", title: "Which graphics does it use?", hint: "Graphics hardware affects gaming images and AI acceleration. The exact model matters, not just the brand.", options: [["nvidia", "NVIDIA"], ["nvidia-old", "Older NVIDIA (GTX 10-series or earlier)"], ["amd", "AMD"], ["intel", "Intel"], ["unsure", "Not sure"]] },
] as const;
export type BeginnerKey = typeof BEGINNER_QUESTIONS[number]["id"];
export type BeginnerAnswers = Partial<Record<BeginnerKey, string>>;
export function beginnerFlow(a: BeginnerAnswers) {
  const blocked = Boolean(a.machine && !["pc", "intel-mac"].includes(a.machine)) || a.origin === "chromeos";
  return BEGINNER_QUESTIONS.filter((q) => q.id === "ram" ? !blocked && a.purpose === "older" : q.id === "gpu" ? !blocked && (a.purpose === "gaming" || a.purpose === "ai") : true);
}
/** The tip under a question: fixed, or chosen by the earlier "What do you use now?" answer. Text in backticks is shown as code. */
export function beginnerHint(q: typeof BEGINNER_QUESTIONS[number], a: BeginnerAnswers): string | undefined {
  if ("hint" in q) return q.hint;
  if ("hintFor" in q && a.origin && a.origin in q.hintFor) return q.hintFor[a.origin as keyof typeof q.hintFor];
  return undefined;
}
/** Options as listed, with "not sure" answers last. Short-quiz links carry values, not positions, so this order can change freely. */
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

const GPU_NAME: Record<string, string> = { nvidia: "NVIDIA", "nvidia-old": "older NVIDIA", amd: "AMD", intel: "Intel" };

/** A detailed-quiz results link for answers the short quiz can't map to one distro; null when the machine is too vague to match. */
export function advancedResultsHref(a: BeginnerAnswers): string | null {
  const device = a.machine === "pc32" ? "pc32" : a.machine === "pc" || a.machine === "intel-mac" ? "pc" : undefined;
  if (!device) return null;
  const use: Record<string, Use> = { everyday: "everyday", gaming: "gaming", older: "old-hw", programming: "dev", ai: "ai" };
  const answers: Answers = {
    from: a.origin === "windows" || a.origin === "mac" || a.origin === "linux" || a.origin === "chromeos" ? a.origin : undefined,
    use: a.purpose ? use[a.purpose] : undefined,
    // The short quiz is for newcomers; people already on Linux keep every experience level.
    level: a.origin === "linux" ? undefined : "new",
    device,
    ram: a.ram === "1" ? 1 : a.ram === "2" ? 2 : undefined,
  };
  return `/pick/?a=${encodeAnswers(answers)}`;
}

export type BeginnerResult = { kind: "compatibility-check"; title: string; caveat: string; href: string; /** Detailed-quiz results for this computer, when we can match it. */ advanced?: string | null } | { kind: "recommendation"; slug: string; reasons: string[]; caveat: string; alternatives: { slug: string; reason: string }[] };
/** Editorial starting points, independent of rank. Eligibility is not hardware certification. */
export function beginnerRecommendation(a: BeginnerAnswers, tracked: ReadonlySet<string>): BeginnerResult {
  const check = (title: string, caveat: string, href = "/switch/getting-started/#hardware", advanced: string | null = null): BeginnerResult => ({ kind: "compatibility-check", title, caveat, href, advanced });
  if (!a.origin || !a.machine || !a.purpose) return check("Check your computer first", "Answer the three core questions before choosing a download.");
  if (a.machine === "apple") return check("Check your Mac with Asahi", "Apple Silicon needs a model-specific installation route. A regular Mint or Fedora PC image is not suitable. Check your exact model and required features.", "https://asahilinux.org/docs/platform/feature-support/overview/");
  if (a.origin === "chromeos" && ["pc", "intel-mac", "unsure"].includes(a.machine)) return check("Check your Chromebook first", "Most Chromebooks need a firmware change before a regular Linux image will install, and some models can't take one. To try Linux without replacing ChromeOS, turn on Linux in ChromeOS settings.", "/switch/getting-started/#hardware", a.machine === "unsure" ? null : advancedResultsHref(a));
  if (a.machine === "unsure") return check("Find out which computer you have", "The right download depends on the processor: most PCs are 64-bit, but Apple Silicon Macs, ARM boards and very old PCs each need a different image. The tip on the computer question shows where to look.");
  if (a.machine === "pc32") return check("Check your 32-bit PC first", "Most distros no longer make 32-bit images, so the usual starting points won't install. A few light systems still do; check that yours supports your exact processor and memory.", "/switch/getting-started/#hardware", advancedResultsHref(a));
  if (a.machine === "arm") return check("Use your board's own system", "Raspberry Pi and other ARM boards need an image made for that board, not a PC download. For a Raspberry Pi, start with Raspberry Pi OS; for other boards, check the maker's supported systems or Armbian.", "/switch/getting-started/#hardware", "/pick/?mode=advanced");
  if (a.purpose === "older" && (!a.ram || a.ram === "unsure" || Number(a.ram) < 2)) return check("Check memory and hardware requirements", a.ram === "1" ? "Under 2 GB is too little for most beginner desktops. A few very light systems still run; check their current requirements." : "We don't have enough information for a safe beginner recommendation. Check RAM and the current requirements before choosing a lightweight system.", "/switch/getting-started/#hardware", a.ram === "1" ? advancedResultsHref(a) : null);
  const slug = a.purpose === "gaming" ? "bazzite" : a.purpose === "programming" || a.purpose === "ai" ? "ubuntu" : "mint";
  if (!tracked.has(slug)) return check("Explore the detailed picker", "This starting option is not in the current catalogue. We won't substitute an unrelated distro.", "/pick/?mode=advanced");
  const reasons = slug === "bazzite" ? ["Built around gaming, with Steam tooling ready to use.", "System updates can be rolled back."] : slug === "ubuntu" ? ["A documented starting point for development tools.", "Long-term support releases are available."] : ["A familiar desktop with graphical tools for everyday tasks.", a.purpose === "older" ? "Mint offers a lighter Xfce edition; check its current requirements." : "Mint recommends Cinnamon when you are unsure which edition to choose."];
  // Intel Mac driver advice lives in the hardware box (HardwareNotes), not here, so it isn't said twice.
  const gpuName = a.gpu ? GPU_NAME[a.gpu] : undefined;
  const caveat = (a.purpose === "gaming" ? `Check Bazzite's image picker for ${a.gpu === "unsure" || !a.gpu ? "your graphics hardware (identify it first)" : `${gpuName} and your exact GPU model`}. Anti-cheat can block games; check your essential titles before switching.` : a.purpose === "work" ? "Check your essential apps and file formats first. An alternative may not replace every feature your work requires." : "Back up first, and check that the apps you rely on run on Linux. This is a starting point, not a compatibility guarantee.");
  const alternatives = [{ slug: "zorin", reason: "Another guided desktop option with familiar layouts." }, { slug: "ubuntu", reason: "Consider it if its documentation and development tools fit your needs." }].filter((d) => d.slug !== slug && tracked.has(d.slug) && (a.purpose !== "older" || PROFILES.find((p) => p.key === d.slug)!.minRamGb <= Number(a.ram))).slice(0, 2);
  if (a.purpose === "ai") {
    reasons.splice(0, reasons.length, "Ubuntu provides a documented platform for AI and development tools.", "Long-term support releases are available; choose the release your AI tools support.");
    return { kind: "recommendation", slug, reasons, caveat: a.machine === "intel-mac" ? `${caveat} For AI acceleration, also check your exact GPU, available memory and framework support.` : `Check your exact GPU and available memory before choosing models. ${a.gpu === "nvidia" || a.gpu === "nvidia-old" ? "Verify the CUDA and driver requirements for your tools." : a.gpu === "amd" ? "ROCm supports selected AMD GPUs and OS releases, not every AMD card." : "Do not assume GPU acceleration is supported. Identify the GPU and check your framework; CPU-only inference may be an option."}`, alternatives: [] };
  }
  return { kind: "recommendation", slug, reasons, caveat, alternatives };
}

export const BEGINNER_SOURCES = [
  { name: "Mint editions and architecture", href: "https://linuxmint-installation-guide.readthedocs.io/en/latest/choose.html" },
  { name: "Bazzite installation and hardware guidance", href: "https://docs.bazzite.gg/General/Installation_Guide/" },
  { name: "Ubuntu for developers", href: "https://ubuntu.com/desktop/developers" },
  { name: "Asahi model support", href: "https://asahilinux.org/docs/platform/feature-support/overview/" },
];
/** Distros with a step-by-step section on /switch/getting-started/. */
export const GUIDE_SLUGS: ReadonlySet<string> = new Set(["mint", "ubuntu", "bazzite"]);
export const BEGINNER_REVIEWED = "2026-11-13";
