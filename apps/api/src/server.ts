import { openDb } from "@linux-statistics/db";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? "0.0.0.0";

const { db, kind } = await openDb();
const app = await buildApp(db);

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`API listening on http://localhost:${PORT} (${kind})`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
