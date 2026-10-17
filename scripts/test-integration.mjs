import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const testUrl = new URL(process.env.TEST_DATABASE_URL ?? "");
const developmentUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : null;

if (
  !["postgres:", "postgresql:"].includes(testUrl.protocol) ||
  !testUrl.pathname.endsWith("_test") ||
  (developmentUrl && testUrl.pathname === developmentUrl.pathname)
) {
  throw new Error("TEST_DATABASE_URL must name a separate database ending in _test.");
}

const env = {
  ...process.env,
  DATABASE_URL: testUrl.href,
  TASKFLOW_INTEGRATION: "1",
};

for (const [entry, args] of [
  ["../node_modules/prisma/build/index.js", ["migrate", "deploy"]],
  ["../node_modules/vitest/vitest.mjs", ["run"]],
]) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(entry, import.meta.url)), ...args], {
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
