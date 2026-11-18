// Checks one or more article drafts before they move into the repo:
//   pnpm --filter @linux-statistics/site article:check <file.md> [more.md ...]
// Runs the same front-matter schema the site build uses, the Q&A answer length,
// a topic/article slug clash check, and warns on unknown distro slugs.
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { articleFrontmatter, readingMinutes } from "../src/lib/articles";
import { TOPIC_SLUGS } from "../src/lib/article-topics";
import { readFrontmatter } from "../src/lib/frontmatter";
import { PROFILES } from "../src/lib/picker-profiles";

const files = process.argv.slice(2).filter((f) => f.endsWith(".md") && !basename(f).startsWith("_") && basename(f) !== "README.md");
if (files.length === 0) {
  console.error("usage: article:check <draft.md> [more.md ...]");
  process.exit(2);
}
const known = new Set(PROFILES.map((p) => p.key));
let bad = 0;
for (const f of files) {
  const path = resolve(process.env.INIT_CWD ?? process.cwd(), f);
  const slug = basename(f, ".md");
  const fm = readFrontmatter(readFileSync(path, "utf8"));
  const problems: string[] = [];
  const notes: string[] = [];
  if (!fm) problems.push("no front matter (--- block at the top)");
  else {
    const r = articleFrontmatter.safeParse(fm.data);
    if (!r.success) for (const i of r.error.issues) problems.push(`${i.path.join(".") || "front matter"}: ${i.message}`);
    else {
      notes.push(`${r.data.type} in ${r.data.topic}${r.data.alsoIn?.length ? ` (also ${r.data.alsoIn.join(", ")})` : ""}, ${readingMinutes(fm.body)} min read`);
      for (const d of r.data.distros ?? []) if (!known.has(d)) notes.push(`note: distro "${d}" isn't a quiz-profiled distro; check the slug matches /distro/${d}/`);
    }
    if (!/^[a-z0-9-]+$/.test(slug)) problems.push(`file name "${slug}" must be lowercase letters, digits and dashes (it becomes the URL)`);
    if ((TOPIC_SLUGS as readonly string[]).includes(slug)) problems.push(`file name "${slug}" clashes with a topic hub URL`);
  }
  if (problems.length) {
    bad++;
    console.log(`✗ ${f}`);
    for (const p of problems) console.log(`    ${p}`);
  } else console.log(`✓ ${f}`);
  for (const n of notes) console.log(`    ${n}`);
}
process.exit(bad ? 1 : 0);
