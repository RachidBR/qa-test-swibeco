import { once } from "node:events";
import { spawn, type ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import { expect, test as base } from "@playwright/test";

import { createDownstreamAdmin } from "../helpers/downstream-admin";
import { DOWNSTREAM_PORT, downstreamBaseUrl } from "../helpers/test-config";

type DownstreamAdmin = ReturnType<typeof createDownstreamAdmin>;

async function isDownstreamServerReady() {
  try {
    const response = await fetch(`${downstreamBaseUrl}/__admin/requests`);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForDownstreamServer() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await isDownstreamServerReady()) {
      return;
    }

    await delay(250);
  }

  throw new Error("Downstream stub did not become ready in time");
}

async function stopProcess(process: ChildProcess) {
  if (process.exitCode !== null) {
    return;
  }

  process.kill("SIGTERM");
  await once(process, "exit");
}

export const test = base.extend<
  {
    downstreamAdmin: DownstreamAdmin;
  },
  {
    downstreamServer: void;
  }
>({
  downstreamServer: [
    async ({}, use) => {
      let serverProcess: ChildProcess | undefined;
      let ownsServer = false;

      if (!(await isDownstreamServerReady())) {
        serverProcess = spawn("node", ["scripts/downstream-stub.js"], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DOWNSTREAM_PORT: String(DOWNSTREAM_PORT),
          },
          stdio: "pipe",
        });

        serverProcess.stderr?.on("data", (chunk) => {
          process.stderr.write(chunk);
        });

        ownsServer = true;
      }

      await waitForDownstreamServer();
      await use();

      if (serverProcess && ownsServer) {
        await stopProcess(serverProcess);
      }
    },
    { auto: true, scope: "worker" },
  ],
  downstreamAdmin: async ({ downstreamServer, request }, use) => {
    const downstreamAdmin = createDownstreamAdmin(request);
    await downstreamAdmin.reset();
    await use(downstreamAdmin);
  },
});

export { expect };
