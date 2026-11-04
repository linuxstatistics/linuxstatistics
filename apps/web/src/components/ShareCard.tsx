import { useMarketShare } from "../api";
import { linuxYearlySeries } from "../lib/marketShare";
import { ShareStat } from "./ShareStat";

export interface ShareCardProps {
  className?: string;
  hint?: string;
}

/** Fetches market share and renders the Linux desktop share KPI. */
export function ShareCard({ className, hint }: ShareCardProps) {
  const { data } = useMarketShare();
  const series = linuxYearlySeries(data ?? []);
  return <ShareStat series={series} className={className} hint={hint} />;
}
