import { BEGINNER_QUESTIONS, type BeginnerAnswers } from "./beginner-picker";

/**
 * Anonymous count of finished quizzes. Sent once per finished quiz in this
 * page visit, never for a shared results link, and never when the browser
 * sends Global Privacy Control. Nothing is written to cookies or storage:
 * the token that lets this visit take the row back lives in memory only.
 */
export type QuizKind = "pick" | "start";

const sent = new Set<string>();

export const gpcOn = () => typeof navigator !== "undefined" && (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

/** The short quiz's answers as a dot-joined value list in question order, e.g. "windows.pc.gaming.amd". */
export function beginnerCode(a: BeginnerAnswers): string {
  return BEGINNER_QUESTIONS.map((q) => a[q.id] ?? "").join(".").replace(/\.+$/, "");
}

/** Send one completion; returns the token to undo it, or null when nothing was sent. */
export async function countQuiz(quiz: QuizKind, code: string, topKey: string, f: typeof fetch = fetch): Promise<string | null> {
  const key = `${quiz}:${code}:${topKey}`;
  if (sent.has(key) || gpcOn()) return null;
  sent.add(key);
  const token = crypto.randomUUID();
  try {
    const res = await f("/api/quiz-completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quiz, code, topKey, token, website: "" }),
      keepalive: true,
    });
    return res.ok ? token : null;
  } catch {
    return null;
  }
}

export async function uncountQuiz(token: string, f: typeof fetch = fetch): Promise<void> {
  try {
    await f(`/api/quiz-completions/${token}`, { method: "DELETE", keepalive: true });
  } catch {
    // Best effort; nothing to show the visitor.
  }
}

/** For tests. */
export const _resetQuizCount = () => sent.clear();
