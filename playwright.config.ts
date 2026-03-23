import { defineConfig } from "@playwright/test";

import { downstreamBaseUrl } from "./helpers/downstreamServer";

const PROXY_PORT = 8000;
const downstreamUrl = new URL(downstreamBaseUrl);

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
      PROXY_TARGET_HOST: downstreamUrl.hostname,
      PROXY_TARGET_PORT: downstreamUrl.port,
      PYTHONUNBUFFERED: "1",
    },
  },
});
