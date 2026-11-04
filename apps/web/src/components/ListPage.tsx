import { useDistros } from "../api";
import { useIsMobile } from "../lib/useIsMobile";
import { ListView } from "./ListView";
import { ShareCard } from "./ShareCard";
import { DistroHighlights } from "./DistroHighlights";
import { StatsMenu } from "./StatsMenu";

export function ListPage() {
  const { data, isLoading, isError } = useDistros();
  const isMobile = useIsMobile();

  return (
    <div className="list-page">
      {/* Desktop shows the cards inline; mobile tucks them into a full-width accordion. */}
      {isMobile ? (
        <StatsMenu />
      ) : (
        <div className="stats-strip">
          <ShareCard className="stat-card" />
          {data && <DistroHighlights items={data} />}
        </div>
      )}
      {isLoading ? (
        <div className="loading">Loading rankings…</div>
      ) : isError || !data ? (
        <div className="error">Couldn’t load rankings. Is the API running?</div>
      ) : (
        <ListView items={data} />
      )}
    </div>
  );
}
