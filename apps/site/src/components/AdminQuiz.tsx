import { useQuery } from "@tanstack/react-query";
import { CardsSkeleton } from "./Skeleton";
import { useMe } from "../api";
import { Island } from "./Island";
import { AdminGate } from "./AdminGate";
import { Distro, Metric, Section, Status, shortDate, useDistroNames } from "./AdminParts";
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
const ORIGIN: Record<string, string> = { windows: "Windows", macos: "macOS", chromeos: "ChromeOS", linux: "Another Linux distro", other: "Something else" };

function Days({ days }: { days: QuizStats["perDay"] }) {
  const peak = Math.max(0, ...days.map((d) => d.pick + d.start));
  const max = Math.max(1, peak);
  const total = days.reduce((a, d) => a + d.pick + d.start, 0);
  if (total === 0) return <p className="adm-empty">No finished quizzes in the last 30 days.</p>;
  const first = days[0];
  const last = days.at(-1);
  return (
    <figure className="adm-chart" style={{ margin: 0 }}>
      <div className="adm-days" role="img" aria-label={`Quiz completions per day for the last 30 days: ${total} in total, at most ${peak} in one day`}>
        {days.map((d) => (
          <div className="adm-day" key={d.day} title={`${shortDate(`${d.day}T00:00:00Z`)}: ${d.pick} full, ${d.start} short`}>
            <i className="adm-day-start" style={{ height: `${(d.start / max) * 100}%` }} />
            <i className="adm-day-pick" style={{ height: `${(d.pick / max) * 100}%` }} />
          </div>
        ))}
      </div>
      {first && last && (
        <div className="adm-axis" aria-hidden="true">
          <span>{shortDate(`${first.day}T00:00:00Z`)}</span>
          <span>Most in a day: {peak}</span>
          <span>{shortDate(`${last.day}T00:00:00Z`)}</span>
        </div>
      )}
      <figcaption className="adm-legend">
        <span className="adm-key adm-key-pick">Full quiz</span>
        <span className="adm-key adm-key-start">Short quiz</span>
      </figcaption>
    </figure>
  );
}

function Tally({ rows, label, empty, name }: { rows: { key: string; n: number }[]; label: string; empty: string; name: (k: string) => string }) {
  if (!rows.length) return <p className="adm-empty">{empty}</p>;
  const total = rows.reduce((a, r) => a + r.n, 0);
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>{label}</th><th className="num">Reports</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td>{name(r.key)}</td>
              <td className="num">{r.n} <span className="adm-muted">({Math.round((r.n / total) * 100)}%)</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Quiz({ s }: { s: QuizStats }) {
  const nameOf = useDistroNames();
  const last30 = s.perDay.reduce((a, d) => a + d.pick + d.start, 0);
  const yes = s.fit.reduce((a, r) => a + r.yes, 0);
  const pickCell = (quiz: string, key: string) =>
    quiz === "start" && key === "check" ? <span className="adm-muted">Hardware check first</span> : <Distro slug={key} name={nameOf(key)} />;
  return (
    <div className="adm">
      <dl className="adm-metrics">
        <Metric label="Completions, 30 days" value={last30.toLocaleString("en-US")} sub={`${s.totals.completions.toLocaleString("en-US")} all time`} />
        <Metric label={'"Did it fit?" votes'} value={s.totals.votes.toLocaleString("en-US")} sub={s.totals.votes ? `${Math.round((yes / s.totals.votes) * 100)}% said yes` : "none yet"} />
        <Metric label="Switch reports" value={s.totals.switchReports.toLocaleString("en-US")} sub="all time" />
      </dl>

      <Section title="Completions per day" sub="Last 30 days, UTC">
        <Days days={s.perDay} />
        <div className="adm-links">
          <a className="adm-btn" href="/api/admin/quiz-completions.csv">Completions CSV</a>
          <a className="adm-btn" href="/api/admin/picker-feedback.csv">Fit votes CSV</a>
          <a className="adm-btn" href="/api/admin/switch-reports.csv">Switch reports CSV</a>
        </div>
      </Section>

      <Section title="Top first results" sub="All time, top 15 per quiz">
        {s.topPicks.length === 0 ? <p className="adm-empty">No finished quizzes yet. Picks show up here after the first one.</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>First result</th><th>Quiz</th><th className="num">Times</th></tr></thead>
              <tbody>
                {s.topPicks.map((r) => (
                  <tr key={r.quiz + r.topKey}>
                    <td>{pickCell(r.quiz, r.topKey)}</td>
                    <td><Status>{QUIZ_NAME[r.quiz] ?? r.quiz}</Status></td>
                    <td className="num">{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title={'"Did it fit?"'} sub="Votes per first result">
        {s.fit.length === 0 ? <p className="adm-empty">No votes yet. People vote on the quiz results page.</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>First result</th><th className="num">Said yes</th><th className="num">Votes</th></tr></thead>
              <tbody>
                {s.fit.map((r) => {
                  const pct = Math.round((r.yes / r.n) * 100);
                  return (
                    <tr key={r.topKey}>
                      <td><Distro slug={r.topKey} name={nameOf(r.topKey)} /></td>
                      <td className="num"><span className="adm-pct"><i style={{ width: `${Math.max(2, pct * 0.6)}px` }} aria-hidden="true" />{pct}%</span></td>
                      <td className="num">{r.n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="note">With only a few votes per pick, read the percentages as hints, not results.</p>
      </Section>

      <Section title="Most common answers" sub="All time, top 15 per quiz">
        {s.topCodes.length === 0 ? <p className="adm-empty">No finished quizzes yet.</p> : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Answers</th><th>Quiz</th><th className="num">Times</th></tr></thead>
              <tbody>
                {s.topCodes.map((r) => (
                  <tr key={r.quiz + r.code}>
                    <td className="adm-wrap">{readableAnswers(r.quiz, r.code)}</td>
                    <td><Status>{QUIZ_NAME[r.quiz] ?? r.quiz}</Status></td>
                    <td className="num">{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Switch reports" sub={`"LinuxStatistics helped me switch", ${s.totals.switchReports} in total`}>
        <div className="adm-two">
          <div><h3>Came from</h3><Tally rows={s.switchFrom} label="Came from" empty="No reports yet." name={(k) => ORIGIN[k] ?? k} /></div>
          <div><h3>Now using</h3><Tally rows={s.switchTo} label="Now using" empty="No reports yet." name={(k) => (k === "(not given)" ? "Not given" : nameOf(k))} /></div>
        </div>
      </Section>
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
      {q.isError ? <p className="error" role="alert">Couldn't load quiz numbers. Try reloading.</p> : q.isLoading || !q.data ? <CardsSkeleton label="Loading quiz numbers" /> : <Quiz s={q.data} />}
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
