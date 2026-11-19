import { openDb, emailStatusCounts } from "@linux-statistics/db";
import { emailConfigFromEnv } from "@linux-statistics/shared/mailer";
import { runEmailList } from "./email-list.js";

const USAGE = `Usage: email-list [--ask-legacy] [--count]
  Daily list upkeep: delete unconfirmed signups after 7 days, send the day-7
  reminder to older signups, drop older signups after 30 days, and sync
  unsubscribes with Resend.
  --count       print the list counts and exit (check before --ask-legacy)
  --ask-legacy  also send the one-time "please confirm" email to signups from
                before confirmation existed
Env: DATABASE_URL, RESEND_API_KEY, RESEND_SEGMENT_ID, EMAIL_LINK_SECRET (the
same value as on the API, which checks the unsubscribe links), WEB_ORIGIN,
API_PUBLIC_URL. Without RESEND_API_KEY or EMAIL_LINK_SECRET nothing is sent
and nothing is synced; only the purge runs.`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) return void console.log(USAGE);
  for (const a of args) if (a !== "--ask-legacy" && a !== "--count") throw new Error(`Unknown argument "${a}".\n${USAGE}`);
  const { db, close } = await openDb({ max: 2 });
  try {
    if (args.includes("--count")) {
      console.log(JSON.stringify(await emailStatusCounts(db)));
      return;
    }
    const web = (process.env.WEB_ORIGIN ?? "https://linuxstatistics.com").replace(/\/$/, "");
    const api = (process.env.API_PUBLIC_URL ?? web).replace(/\/$/, "");
    const { mailer, linkSecret, problem } = emailConfigFromEnv({ ...process.env, NODE_ENV: "production" });
    if (problem) console.log(`${problem}; purge only`);
    const report = await runEmailList(db, mailer, {
      links: { web, api },
      linkSecret,
      askLegacy: args.includes("--ask-legacy"),
      log: (m) => console.error(m),
    });
    console.log(JSON.stringify(report));
    if (report.failures) process.exitCode = 1;
  } finally {
    await close();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(2);
});
