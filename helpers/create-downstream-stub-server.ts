import express, { type Request, type Response } from "express";
import type { Server } from "node:http";

import { DOWNSTREAM_PORT } from "./test-config";
import type { DownstreamResponseConfig, ForwardedRequest } from "./proxy-types";
import { proxyRoutes } from "../data/proxy-test-data";

function listen(app: ReturnType<typeof express>) {
  return new Promise<Server>((resolve) => {
    const stubServer = app.listen(DOWNSTREAM_PORT, "127.0.0.1", () => {
      resolve(stubServer);
    });
  });
}

function close(server: Server) {
  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export function createDownstreamStubServer() {
  const app = express();
  const forwardedRequests: ForwardedRequest[] = [];
  let loginResponse: DownstreamResponseConfig | null = null;
  let server: Server | undefined;

  app.use(express.json());

  app.post(proxyRoutes.userLogin, (request: Request, response: Response) => {
    forwardedRequests.push({
      method: request.method,
      path: request.path,
      headers: request.headers,
      body: request.body ?? null,
    });

    if (!loginResponse) {
      response.status(404).json({ error: "No login response configured" });
      return;
    }

    response.status(loginResponse.status ?? 200);

    if (typeof loginResponse.body === "string") {
      response.send(loginResponse.body);
      return;
    }

    response.json(loginResponse.body ?? {});
  });

  return {
    async start() {
      server = await listen(app);
    },
    async stop() {
      if (!server) {
        return;
      }

      const activeServer = server;
      server = undefined;
      await close(activeServer);
    },
    reset() {
      forwardedRequests.length = 0;
      loginResponse = null;
    },
    setLoginResponse(responseConfig: DownstreamResponseConfig) {
      loginResponse = responseConfig;
    },
    getForwardedRequests() {
      return forwardedRequests;
    },
  };
}
