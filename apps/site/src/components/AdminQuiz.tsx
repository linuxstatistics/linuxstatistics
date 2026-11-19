import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { readableAnswers } from "../lib/admin-decode";

interface QuizStats {
  perDay: { day: string; pick: number; start: number }[];
  topPicks: { quiz: string; topKey: string; n: number }[];
  topCodes: { quiz: string; code: string; n: number }[];
  fit: { topKey: string; yes: number; n: number }[];
  switchFrom: { key: string; n: number }[];
  switchTo: { key: string; n: number }[];
  totals: { completions: number; votes: number; switchReports: number };
}

const QUIZ_NAME: Record<string, string> = { pick: "Full quiz", start: "Short quiz" };
/** "check" is the short quiz's "check your hardware first" result, not a distro. */
const pickName = (k: string) => (k === "check" ? "(hardware check first)" : k);

function Days({ days }: { days: QuizStats["perDay"] }) {
  const max = Math.max(1, ...days.map((d) => d.pick + d.start));
  return (
    <div className="adm-days" role="img" aria-label={`Quiz completions per day for the last 30 days, ${days.reduce((a, d) => a + d.pick + d.start, 0)} in total`}>
      {days.map((d) => (
        <div className="adm-day" key={d.day} title={`${d.day}: ${d.pick} full, ${d.start} short`}>
          <i className="adm-day-start" style={{ height: `${(d.start / max) * 100}%` }} />
          <i className="adm-day-pick" style={{ height: `${(d.pick / max) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function Tally({ rows, empty }: { rows: { key: string; n: number }[]; empty: string }) {
  if (!rows.length) return <p className="note">{empty}</p>;
  return (
    <table className="data-table">
      <tbody>{rows.map((r) => <tr key={r.key}><td>{r.key}</td><td className="num">{r.n}</td></tr>)}</tbody>
    </table>
  );
}

function Quiz({ s }: { s: QuizStats }) {
  const last30 = s.perDay.reduce((a, d) => a + d.pick + d.start, 0);
  return (
    <div className="adm">
      <h2>Completions, last 30 days</h2>
      <p className="note"><b>{last30}</b> in 30 days, <b>{s.totals.completions}</b> all time. <span className="adm-key adm-key-pick">Full quiz</span> <span className="adm-key adm-key-start">Short quiz</span></p>
      <Days days={s.perDay} />
      <p className="note"><a href="/api/admin/quiz-completions.csv">Completions CSV</a> · <a href="/api/admin/picker-feedback.csv">Fit votes CSV</a> · <a href="/api/admin/switch-reports.csv">Switch reports CSV</a></p>

      <h2>Top first results</h2>
      {s.topPicks.length === 0 ? <p className="note">No completions yet.</p> : (
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Quiz</th><th>First result</th><th className="num">Times</th></tr></thead>
          <tbody>{s.topPicks.map((r) => <tr key={r.quiz + r.topKey}><td>{QUIZ_NAME[r.quiz] ?? r.quiz}</td><td>{r.quiz === "pick" || r.topKey !== "check" ? <a href={`/distro/${r.topKey}/`}>{pickName(r.topKey)}</a> : pickName(r.topKey)}</td><td className="num">{r.n}</td></tr>)}</tbody>
        </table></div>
      )}

      <h2>"Did it fit?"</h2>
      {s.fit.length === 0 ? <p className="note">No votes yet.</p> : (
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>First result</th><th className="num">Yes</th><th className="num">Votes</th></tr></thead>
          <tbody>{s.fit.map((r) => <tr key={r.topKey}><td>{r.topKey}</td><td className="num">{Math.round((r.yes / r.n) * 100)}%</td><td className="num">{r.n}</td></tr>)}</tbody>
        </table></div>
      )}
      <p className="note">Few votes per pick: read the percentages as hints, not results.</p>

      <h2>Most common answers</h2>
      {s.topCodes.length === 0 ? <p className="note">No completions yet.</p> : (
        <div className="table-scroll"><table className="data-table">
          <thead><tr><th>Quiz</th><th>Answers</th><th className="num">Times</th></tr></thead>
          <tbody>{s.topCodes.map((r) => <tr key={r.quiz + r.code}><td>{QUIZ_NAME[r.quiz] ?? r.quiz}</td><td>{readableAnswers(r.quiz, r.code)}</td><td className="num">{r.n}</td></tr>)}</tbody>
        </table></div>
      )}

      <h2>Switch reports</h2>
      <div className="adm-two">
        <div><h3>Came from</h3><Tally rows={s.switchFrom} empty="No reports yet." /></div>
        <div><h3>Now using</h3><Tally rows={s.switchTo} empty="No reports yet." /></div>
      </div>
    </div>
  );
}

export function AdminQuizInner() {
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["admin-quiz"],
    queryFn: async () => {
      const res = await fetch("/api/admin/quiz", { credentials: "include" });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as QuizStats;
    },
    enabled: me?.role === "admin",
  });
  return (
    <AdminGate>
      {q.isError ? <p className="error">Couldn't load quiz numbers. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading quiz numbers" /> : <Quiz s={q.data} />}
    </AdminGate>
  );
}

/** Island: quiz completions, picks, fit votes and switch reports for the admin. */
export function AdminQuiz() {
  return (
    <Island>
      <AdminQuizInner />
    </Island>
  );
}
