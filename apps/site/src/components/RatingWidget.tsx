import { useState } from "react";
import type { Contribution, Me } from "@linux-statistics/shared";

export function RatingWidget({
  me,
  mine,
  onSave,
  onDelete,
  saved = false,
}: {
  me: Me | null;
  mine: Contribution | null;
  onSave: (c: Contribution) => void;
  onDelete: () => void;
  /** True once the user's save has succeeded. */
  saved?: boolean;
}) {
  const [rating, setRating] = useState<number | null>(mine?.rating ?? null);
  const [usesIt, setUsesIt] = useState<boolean>(mine?.usesIt ?? false);
  const [reviewBody, setReviewBody] = useState<string>(mine?.reviewBody ?? "");
  // Track edits so the confirmation hides once the user changes something again.
  const [dirty, setDirty] = useState(false);

  if (!me) {
    return (
      <div className="rating-widget">
        <span className="signin-link">Sign in to rate</span>
      </div>
    );
  }

  const canSave = rating != null || usesIt || reviewBody.trim().length > 0;
  const showConfirm = saved && !dirty;

  return (
    <div className="rating-widget">
      <div role="group" aria-label="Your rating" className="star-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={rating != null && n <= rating ? "star on" : "star"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            onClick={() => {
              setRating(n);
              setDirty(true);
            }}
          >
            ★
          </button>
        ))}
      </div>
      <label className="uses-it">
        <input
          type="checkbox"
          checked={usesIt}
          onChange={(e) => {
            setUsesIt(e.target.checked);
            setDirty(true);
          }}
        />
        I use this
      </label>
      <textarea
        className="review-input"
        placeholder="Optional review"
        maxLength={1000}
        value={reviewBody}
        onChange={(e) => {
          setReviewBody(e.target.value);
          setDirty(true);
        }}
      />
      <div className="rating-actions">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            setDirty(false);
            onSave({ rating, usesIt, reviewBody: reviewBody.trim() || null });
          }}
        >
          Save
        </button>
        {mine && (
          <button type="button" className="ghost" onClick={onDelete}>
            Remove
          </button>
        )}
      </div>
      {showConfirm && (
        <p className="rating-saved" role="status">
          Saved — thanks. The community score updates when the site next rebuilds.
        </p>
      )}
    </div>
  );
}
