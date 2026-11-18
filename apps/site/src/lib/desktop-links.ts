import { DESKTOP_LABEL, INIT_LABEL, PACKAGE_MANAGER_LABEL, WINDOW_MANAGERS, type DesktopId, type DistroFacts } from "@linux-statistics/shared";
import { glossaryBySlug } from "./glossary";

export interface DesktopLink {
  label: string;
  href?: string;
}

/** Where a desktop name links: its glossary entry, or the window-manager entry for a WM. */
export function desktopHref(id: DesktopId): string | undefined {
  if (glossaryBySlug(id)) return `/glossary/${id}/`;
  if (WINDOW_MANAGERS.has(id)) return "/glossary/window-manager/";
  return undefined;
}

export const desktopLink = (id: DesktopId): DesktopLink => ({ label: DESKTOP_LABEL[id], href: desktopHref(id) });

/** Plain list: "GNOME, KDE Plasma and Xfce". */
export function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Other desktops, with official flavours that are their own distro named after the desktop. */
export function offeredLinks(f: DistroFacts, nameOf: (slug: string) => string | undefined): DesktopLink[] {
  const out: DesktopLink[] = f.otherDesktops.map(desktopLink);
  for (const e of f.editions) {
    const name = nameOf(e.slug);
    out.push({ label: name ? `${DESKTOP_LABEL[e.desktop]} (${name})` : DESKTOP_LABEL[e.desktop], href: name ? `/distro/${e.slug}/` : desktopHref(e.desktop) });
  }
  return out;
}

/** Key-fact sentences about the desktop, package manager and init. */
export function factSentences(name: string, f: DistroFacts, nameOf: (slug: string) => string | undefined): string[] {
  const out: string[] = [];
  const others = [...f.otherDesktops.map((d) => DESKTOP_LABEL[d]), ...f.editions.map((e) => (nameOf(e.slug) ? `${DESKTOP_LABEL[e.desktop]} (as ${nameOf(e.slug)})` : DESKTOP_LABEL[e.desktop]))];
  if (f.defaultDesktop) {
    out.push(`${name} ships with the ${DESKTOP_LABEL[f.defaultDesktop]} ${WINDOW_MANAGERS.has(f.defaultDesktop) ? "window manager" : "desktop"} by default${others.length ? `; ${listNames(others)} ${others.length === 1 ? "is" : "are"} also offered` : ""}.`);
  } else if (others.length) {
    out.push(`${name} has no single default desktop; you choose from ${listNames(others)}.`);
  }
  if (f.packageManager && f.init) out.push(`${name} installs software with ${PACKAGE_MANAGER_LABEL[f.packageManager]} and starts with ${INIT_LABEL[f.init]}.`);
  else if (f.packageManager) out.push(`${name} installs software with ${PACKAGE_MANAGER_LABEL[f.packageManager]}.`);
  else if (f.init) out.push(`${name} starts with ${INIT_LABEL[f.init]}.`);
  return out;
}
