import { PRESS_FILES } from "@linux-statistics/shared";
import { CONTACT, SOCIAL, SOURCE_URL } from "../config/site";

/** Who runs the site, for assistants and search engines. No street address: it's a one-person site. */
export const ORG_DESCRIPTION =
  "Independent, open-source statistics on Linux distributions: an open popularity index, release support dates, telemetry defaults, GitHub activity and community ratings, plus a quiz to help people pick a distro.";

export interface Crumb {
  name: string;
  /** Path; the last crumb (the current page) has none. */
  href?: string;
}

/** Site-wide WebSite + Organization graph, on every page. */
export function siteGraph(site: string) {
  return [
    { "@type": "WebSite", "@id": `${site}/#website`, name: "LinuxStatistics", url: `${site}/`, description: ORG_DESCRIPTION, publisher: { "@id": `${site}/#org` }, inLanguage: "en" },
    {
      "@type": "Organization",
      "@id": `${site}/#org`,
      name: "LinuxStatistics",
      url: `${site}/`,
      description: ORG_DESCRIPTION,
      logo: { "@type": "ImageObject", url: `${site}/press/${PRESS_FILES.tilePng}`, width: 1024, height: 1024 },
      email: CONTACT.general,
      contactPoint: { "@type": "ContactPoint", contactType: "general inquiries", email: CONTACT.general, url: `${site}/about/` },
      sameAs: [...SOCIAL.map((s) => s.href), SOURCE_URL.replace(/\/[^/]+$/, "")],
    },
  ];
}

/** BreadcrumbList for a visible breadcrumb; the current page is the last item. */
export function breadcrumbLd(site: string, crumbs: Crumb[], currentUrl: string) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href ? new URL(c.href, `${site}/`).href : currentUrl,
    })),
  };
}

/** One JSON-LD document: the site graph, an optional breadcrumb, and the page's own nodes. */
export function pageGraph(site: string, opts: { page?: Record<string, unknown>; crumbs?: Crumb[]; url: string }) {
  const nodes: Record<string, unknown>[] = [...siteGraph(site)];
  if (opts.crumbs?.length) nodes.push(breadcrumbLd(site, opts.crumbs, opts.url));
  if (opts.page) {
    const { "@context": _ctx, "@graph": graph, ...rest } = opts.page as Record<string, unknown> & { "@graph"?: Record<string, unknown>[] };
    if (Array.isArray(graph)) nodes.push(...graph);
    if (Object.keys(rest).length) nodes.push(rest);
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** FAQPage node from question/answer pairs (plain text). */
export function faqNode(items: { q: string; a: string }[]) {
  return { "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
}

/** ItemList node: ordered links to distro pages. */
export function itemListNode(site: string, name: string, items: { name: string; href: string }[]) {
  return {
    "@type": "ItemList",
    name,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: new URL(it.href, `${site}/`).href })),
  };
}

/** DefinedTermSet node for the glossary, with one DefinedTerm per entry. */
export function definedTermSetNode(site: string, terms: { slug: string; term: string; short: string; aka?: string[] }[]) {
  const setId = `${site}/glossary/#set`;
  return {
    "@type": "DefinedTermSet",
    "@id": setId,
    name: "LinuxStatistics glossary",
    url: `${site}/glossary/`,
    hasDefinedTerm: terms.map((t) => definedTermNode(site, t, setId)),
  };
}

/** One DefinedTerm, linked to the glossary set. */
export function definedTermNode(site: string, t: { slug: string; term: string; short: string; aka?: string[] }, setId = `${site}/glossary/#set`) {
  return {
    "@type": "DefinedTerm",
    "@id": `${site}/glossary/${t.slug}/#term`,
    name: t.term,
    ...(t.aka?.length ? { alternateName: t.aka } : {}),
    description: t.short,
    url: `${site}/glossary/${t.slug}/`,
    inDefinedTermSet: setId,
  };
}
