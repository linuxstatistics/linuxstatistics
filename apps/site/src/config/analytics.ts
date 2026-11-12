/**
 * Vercel Web Analytics (cookieless page-view counts). On only in Vercel
 * production builds, so local, preview and self-hosted builds load nothing;
 * the privacy page text follows the same switch. Vercel serves the script
 * from the site's own origin once Analytics is enabled for the project.
 */
export interface AnalyticsConfig {
  enabled: boolean;
  scriptSrc: string;
  /** Data endpoint, set only when Vercel gives the project a custom base path. */
  endpoint?: string;
}

export function analyticsFor(env: Record<string, string | undefined>): AnalyticsConfig {
  const base = (env.PUBLIC_VERCEL_OBSERVABILITY_BASEPATH || env.VERCEL_OBSERVABILITY_BASEPATH || "").replace(/\/$/, "");
  return {
    enabled: env.VERCEL_ENV === "production" || env.ANALYTICS === "1",
    scriptSrc: base ? `${base}/insights/script.js` : "/_vercel/insights/script.js",
    endpoint: base ? `${base}/insights` : undefined,
  };
}

export const analytics = analyticsFor(process.env);
