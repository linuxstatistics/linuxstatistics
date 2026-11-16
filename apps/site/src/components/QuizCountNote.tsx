import { useEffect, useRef, useState } from "react";
import { countQuiz, gpcOn, uncountQuiz, type QuizKind } from "../lib/quiz-count";

/**
 * Counts a finished quiz once (only when `fresh`: the visitor answered the
 * last question in this visit, not a shared link) and says so, with a
 * one-click undo. Shows nothing for a shared link.
 */
export function QuizCountNote({ quiz, code, topKey, fresh }: { quiz: QuizKind; code: string; topKey: string | null; fresh: boolean }) {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "counted" | "undone" | "gpc">("idle");
  const started = useRef(false);

  useEffect(() => {
    if (!fresh || !topKey || started.current) return;
    started.current = true;
    if (gpcOn()) { setState("gpc"); return; }
    void countQuiz(quiz, code, topKey).then((t) => { if (t) { setToken(t); setState("counted"); } });
  }, [fresh, quiz, code, topKey]);

  if (state === "idle") return null;
  return (
    <p className="quiz-count-note" aria-live="polite">
      {state === "gpc" && <>Your browser asks sites not to share data, so we didn't count this quiz. </>}
      {state === "counted" && (
        <>
          We counted this quiz anonymously (answers and top match, no IP or cookie) to improve it and publish totals.{" "}
          <button type="button" className="link-button" onClick={() => { if (token) void uncountQuiz(token); setState("undone"); }}>
            Don't count my answers
          </button>{" "}
        </>
      )}
      {state === "undone" && <>Removed. This quiz isn't counted. </>}
      <a href="/privacy/#quiz">Privacy</a>
    </p>
  );
}
