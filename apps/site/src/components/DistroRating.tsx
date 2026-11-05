import type { Me } from "@linux-statistics/shared";
import { useQueryClient } from "@tanstack/react-query";
import { devLogin, loginHref, useDeleteContribution, useDistro, useMe, useProviders, useUpsertContribution } from "../api";
import { Island } from "./Island";
import { RatingWidget } from "./RatingWidget";

function DistroRatingInner({ slug }: { slug: string }) {
  const { data: me } = useMe();
  const { data: providers } = useProviders();
  const qc = useQueryClient();
  // Only signed-in users need their own contribution, so fetch the detail then.
  const { data: detail } = useDistro(me ? slug : null);
  const save = useUpsertContribution(slug);
  const remove = useDeleteContribution(slug);
  if (me && !detail) return <div className="rating-widget loading">Loading…</div>;
  return (
    <RatingWidget
      // Remount once the user's own contribution arrives so the form starts from it.
      key={detail?.myContribution ? "mine" : "new"}
      me={(me ?? null) as Me | null}
      mine={detail?.myContribution ?? null}
      onSave={(c) => save.mutate(c)}
      onDelete={() => remove.mutate()}
      saved={save.isSuccess}
      providers={providers ?? []}
      loginHref={loginHref}
      onDevLogin={async () => {
        await devLogin();
        qc.invalidateQueries({ queryKey: ["me"] });
      }}
    />
  );
}

/** Island: the rating form on a distro page. */
export function DistroRating(props: { slug: string }) {
  return (
    <Island>
      <DistroRatingInner {...props} />
    </Island>
  );
}
