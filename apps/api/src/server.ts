import { defaultPgliteDir, initPgliteDb } from "@linux-statistics/db";
import { buildApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3001);

const { db } = await initPgliteDb(defaultPgliteDir());
const app = await buildApp(db);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`API listening on http://localhost:${PORT}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
