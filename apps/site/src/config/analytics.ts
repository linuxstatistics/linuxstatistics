/**
 * Vercel Web Analytics (cookieless page-view counts) and Speed Insights
 * (page-load timings). On only in Vercel production builds, so local, preview
 * and self-hosted builds load nothing; the privacy page text follows the same
 * switch. Vercel serves both scripts from the site's own origin.
 */
export interface AnalyticsConfig {
  enabled: boolean;
  scriptSrc: string;
  /** Data endpoint, set only when Vercel gives the project a custom base path. */
  endpoint?: string;
  speedScriptSrc: string;
  speedEndpoint?: string;
}

export function analyticsFor(env: Record<string, string | undefined>): AnalyticsConfig {
  const base = (env.PUBLIC_VERCEL_OBSERVABILITY_BASEPATH || env.VERCEL_OBSERVABILITY_BASEPATH || "").replace(/\/$/, "");
  return {
    enabled: env.VERCEL_ENV === "production" || env.ANALYTICS === "1",
    scriptSrc: base ? `${base}/insights/script.js` : "/_vercel/insights/script.js",
    endpoint: base ? `${base}/insights` : undefined,
    speedScriptSrc: base ? `${base}/speed-insights/script.js` : "/_vercel/speed-insights/script.js",
    speedEndpoint: base ? `${base}/speed-insights/vitals` : undefined,
  };
}

export const analytics = analyticsFor(process.env);
