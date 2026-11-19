import { QUESTIONS, decodeAnswers } from "./picker-questions";
import { BEGINNER_QUESTIONS } from "./beginner-picker";

/**
 * Readable answers for a stored quiz code, for the admin quiz page.
 * "pick" codes use the advanced quiz's share format; "start" codes are the short
 * quiz's dot-joined values in question order (see beginnerCode).
 */
export function readableAnswers(quiz: string, code: string): string {
  if (quiz === "pick") {
    const a = decodeAnswers(code) as Record<string, string | undefined>;
    const parts = QUESTIONS.flatMap((q) => {
      const v = a[q.id];
      const label = v ? q.options.find(([o]) => o === v)?.[1] : undefined;
      return label ? [label] : [];
    });
    return parts.length ? parts.join(" · ") : `(unreadable code ${code})`;
  }
  if (quiz === "start") {
    const values = code.split(".");
    const parts = BEGINNER_QUESTIONS.flatMap((q, i) => {
      const v = values[i];
      if (!v) return [];
      const label = (q.options as readonly (readonly [string, string])[]).find(([o]) => o === v)?.[1];
      return [label ?? v];
    });
    return parts.length ? parts.join(" · ") : `(empty)`;
  }
  return code;
}
