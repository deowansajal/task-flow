import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) },
    conditions: ["react-server"],
  },
  test: {
    environment: "node",
    include: process.env.TASKFLOW_INTEGRATION === "1"
      ? ["src/**/*.integration.test.ts"]
      : ["src/**/*.test.ts"],
    exclude: process.env.TASKFLOW_INTEGRATION === "1"
      ? []
      : ["src/**/*.integration.test.ts"],
  },
});
