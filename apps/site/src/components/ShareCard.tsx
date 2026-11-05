import type { MarketSharePoint } from "@linux-statistics/shared";
import { latestLinuxShare, linuxYearlySeries } from "../lib/marketShare";
import { ShareStat } from "./ShareStat";

export interface ShareCardProps {
  points: MarketSharePoint[];
  className?: string;
  hint?: string;
}

/** Renders the Linux desktop share KPI from market-share rows. */
export function ShareCard({ points, className, hint }: ShareCardProps) {
  return <ShareStat series={linuxYearlySeries(points)} latest={latestLinuxShare(points)} className={className} hint={hint} />;
}
