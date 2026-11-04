import type { MarketSharePoint } from "@linux-statistics/shared";
import { linuxYearlySeries } from "../lib/marketShare";
import { ShareStat } from "./ShareStat";

export interface ShareCardProps {
  points: MarketSharePoint[];
  className?: string;
  hint?: string;
}

/** Renders the Linux desktop share KPI from market-share rows. */
export function ShareCard({ points, className, hint }: ShareCardProps) {
  return <ShareStat series={linuxYearlySeries(points)} className={className} hint={hint} />;
}
