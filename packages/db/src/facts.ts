import { eq } from "drizzle-orm";
import {
  desktopSchema,
  factSourceSchema,
  initSystemSchema,
  packageManagerSchema,
  type DesktopId,
  type DistroFacts,
  type InitSystem,
  type PackageManager,
} from "@linux-statistics/shared";
import type { Database } from "./client.js";
import { distroFacts } from "./schema.js";

export interface CuratedFactsInput {
  defaultDesktop: DesktopId | null;
  otherDesktops: DesktopId[];
  editions: { desktop: DesktopId; slug: string }[];
  packageManager: PackageManager | null;
  init: InitSystem | null;
  sourceUrl: string;
}

type Row = typeof distroFacts.$inferSelect;

async function rowFor(db: Database, distroId: number): Promise<Row | null> {
  const [row] = await db.select().from(distroFacts).where(eq(distroFacts.distroId, distroId));
  return row ?? null;
}

/**
 * Write hand-checked facts. The desktop fields are always ours once a distro
 * has a curated entry (a null default means "you pick"); package manager and
 * init are set only when the curated value is known, so a value a source
 * filled earlier stays until we curate one.
 */
export async function applyCuratedFacts(db: Database, distroId: number, f: CuratedFactsInput): Promise<void> {
  const old = await rowFor(db, distroId);
  const sources: Record<string, string> = { ...(old?.fieldSources ?? {}), defaultDesktop: "curated", otherDesktops: "curated", editions: "curated", sourceUrl: "curated" };
  if (f.packageManager) sources.packageManager = "curated";
  if (f.init) sources.init = "curated";
  const values = {
    defaultDesktop: f.defaultDesktop,
    otherDesktops: f.otherDesktops.filter((d) => d !== f.defaultDesktop),
    editions: f.editions,
    packageManager: f.packageManager ?? old?.packageManager ?? null,
    init: f.init ?? old?.init ?? null,
    sourceUrl: f.sourceUrl,
    fieldSources: sources,
    updatedAt: new Date(),
  };
  await db.insert(distroFacts).values({ distroId, ...values }).onConflictDoUpdate({ target: distroFacts.distroId, set: values });
}

/**
 * Fill empty fields from a source. Never sets the default desktop, and never
 * touches the desktop list of a distro we curated. Returns the fields filled.
 */
export async function fillFactBlanks(
  db: Database,
  distroId: number,
  source: "wikidata",
  f: { desktops: DesktopId[]; packageManager: PackageManager | null },
): Promise<string[]> {
  const old = await rowFor(db, distroId);
  const fs = old?.fieldSources ?? {};
  const set: Partial<Row> = {};
  const filled: string[] = [];
  const curatedDesktops = fs.otherDesktops === "curated";
  if (!curatedDesktops && f.desktops.length && (old?.otherDesktops.length ?? 0) === 0) {
    set.otherDesktops = [...new Set(f.desktops)];
    filled.push("otherDesktops");
  }
  if (f.packageManager && !old?.packageManager) {
    set.packageManager = f.packageManager;
    filled.push("packageManager");
  }
  if (!filled.length) return [];
  const fieldSources = { ...fs, ...Object.fromEntries(filled.map((k) => [k, source])) };
  if (old) {
    await db.update(distroFacts).set({ ...set, fieldSources, updatedAt: new Date() }).where(eq(distroFacts.distroId, distroId));
  } else {
    await db.insert(distroFacts).values({ distroId, ...set, fieldSources });
  }
  return filled;
}

/** Parse a stored row into the DTO, dropping any value our schema doesn't know. */
export function factsFromRow(row: Row): DistroFacts {
  const desktops = (xs: string[]) => xs.flatMap((x) => (desktopSchema.safeParse(x).success ? [x as DesktopId] : []));
  const def = desktopSchema.safeParse(row.defaultDesktop);
  const pkg = packageManagerSchema.safeParse(row.packageManager);
  const init = initSystemSchema.safeParse(row.init);
  return {
    defaultDesktop: def.success ? def.data : null,
    otherDesktops: desktops(row.otherDesktops),
    editions: row.editions.filter((e) => desktopSchema.safeParse(e.desktop).success) as DistroFacts["editions"],
    packageManager: pkg.success ? pkg.data : null,
    init: init.success ? init.data : null,
    sourceUrl: row.sourceUrl,
    fieldSources: Object.fromEntries(Object.entries(row.fieldSources).filter(([, v]) => factSourceSchema.safeParse(v).success)) as DistroFacts["fieldSources"],
  };
}

export async function getDistroFacts(db: Database, distroId: number): Promise<DistroFacts | null> {
  const row = await rowFor(db, distroId);
  return row ? factsFromRow(row) : null;
}

/** Facts for every distro that has a row, by distro id. */
export async function getAllDistroFacts(db: Database): Promise<Map<number, DistroFacts>> {
  const rows = await db.select().from(distroFacts);
  return new Map(rows.map((r) => [r.distroId, factsFromRow(r)]));
}
