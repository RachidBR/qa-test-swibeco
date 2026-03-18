import { defineConfig } from "@playwright/test";

const proxyPort = 8000;
const downstreamPort = 8085;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${proxyPort}`,
  },
  webServer: [
    {
      command: "node scripts/downstream-stub.js",
      port: downstreamPort,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        DOWNSTREAM_PORT: String(downstreamPort),
      },
    },
    {
      command: "./.venv/bin/python main.py",
      port: proxyPort,
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        PROXY_SERVICE_HOST: "127.0.0.1",
        PROXY_SERVICE_PORT: String(proxyPort),
        PROXY_TARGET_HOST: "127.0.0.1",
        PROXY_TARGET_PORT: String(downstreamPort),
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
});
