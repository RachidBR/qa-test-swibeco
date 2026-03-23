import { defineConfig } from "@playwright/test";

import { PROXY_PORT } from "./helpers/test-config";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PROXY_PORT}`,
  },
  webServer: {
    command: "./.venv/bin/python main.py",
    port: PROXY_PORT,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PROXY_SERVICE_HOST: "127.0.0.1",
      PROXY_SERVICE_PORT: String(PROXY_PORT),
      PROXY_TARGET_HOST: "127.0.0.1",
      PROXY_TARGET_PORT: "8085",
      PYTHONUNBUFFERED: "1",
    },
  },
});
