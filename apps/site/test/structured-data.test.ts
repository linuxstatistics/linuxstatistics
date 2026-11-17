import { expect, test } from "vitest";
import type { DistroDetail } from "@linux-statistics/shared";
import { breadcrumbLd, itemListNode, pageGraph } from "../src/lib/structured-data";
import { distroFaq } from "../src/lib/faq";
import { SOCIAL } from "../src/config/site";

const SITE = "https://linuxstatistics.com";

test("every page carries WebSite + Organization with the official accounts", () => {
  const g = pageGraph(SITE, { url: `${SITE}/` });
  expect(g["@context"]).toBe("https://schema.org");
  const types = g["@graph"].map((n) => n["@type"]);
  expect(types).toEqual(["WebSite", "Organization"]);
  expect(g["@graph"][1]).toMatchObject({ sameAs: SOCIAL.map((s) => s.href) });
});

test("page nodes and @graph pages merge into one graph without nested contexts", () => {
  const g = pageGraph(SITE, {
    url: `${SITE}/x/`,
    page: { "@context": "https://schema.org", "@graph": [{ "@type": "A" }, { "@type": "B" }] },
    crumbs: [{ name: "Home", href: "/" }, { name: "X" }],
  });
  expect(g["@graph"].map((n) => n["@type"])).toEqual(["WebSite", "Organization", "BreadcrumbList", "A", "B"]);
  expect(JSON.stringify(g["@graph"])).not.toContain("@context");
});

test("breadcrumb items are absolute; the last one is the current page", () => {
  const b = breadcrumbLd(SITE, [{ name: "Rankings", href: "/" }, { name: "Mint" }], `${SITE}/distro/mint/`);
  expect(b.itemListElement.map((i) => [i.position, i.item])).toEqual([[1, `${SITE}/`], [2, `${SITE}/distro/mint/`]]);
});

test("item lists are ordered absolute links", () => {
  const l = itemListNode(SITE, "Best", [{ name: "Mint", href: "/distro/mint/" }]);
  expect(l.itemListElement[0]).toMatchObject({ position: 1, url: `${SITE}/distro/mint/` });
});

const d = (o: Partial<DistroDetail>) => ({ slug: "nope", name: "Nope", basedOnSlug: null, family: "other", releases: [], ...o }) as unknown as DistroDetail;

test("distro FAQ only asks what our data answers", () => {
  expect(distroFaq(d({}))).toEqual([]);
  const mint = distroFaq(d({ slug: "mint", name: "Mint", basedOnSlug: "ubuntu", family: "debian", releases: [{ cycle: "22", codename: null, releasedOn: "2024-07-25", latest: "22.3", latestOn: null, supportEnds: null, eol: "2029-04-30", lts: true }] }), { baseName: "Ubuntu", today: "2026-11-17" });
  expect(mint.map((x) => x.q)).toEqual(["Is Mint good for beginners?", "Does Mint collect telemetry?", "How long is Mint supported?", "What is Mint based on?"]);
  expect(mint[0]!.a).toMatch(/^Yes\./);
  expect(mint[2]!.a).toBe("Mint 22.3 LTS is supported until April 2029, according to endoflife.date.");
  for (const x of mint) expect(x.a).not.toMatch(/\u2014|#\d/);
});
