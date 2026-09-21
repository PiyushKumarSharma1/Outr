import { resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { createSeedDatabase } from "./seed.js";
import { JsonDataStore } from "./store.js";

const here = fileURLToPath(new URL(".", import.meta.url));
try {
  loadEnvFile(resolve(here, "../.env"));
} catch {
  // Local configuration is optional; environment variables still take precedence.
}
const dataPath = process.env.OUTR_DATA_PATH ?? resolve(here, "../data/outr.json");
const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

const app = await buildApp({
  store: new JsonDataStore(dataPath, createSeedDatabase),
  logger: true,
});

const shutdown = async () => {
  await app.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await app.listen({ host, port });
