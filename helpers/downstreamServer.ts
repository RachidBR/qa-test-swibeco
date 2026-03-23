import express, { type Response } from "express";
import type { Server } from "node:http";

import { endpoints } from "../data/proxy-test-data";
import type { DownstreamResponseConfig } from "./proxy-types";

const DOWNSTREAM_PORT = 8085;
export const downstreamBaseUrl = `http://127.0.0.1:${DOWNSTREAM_PORT}`;

const downstreamUrl = new URL(downstreamBaseUrl);

export type DownstreamStubServer = {
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): void;
  setLoginResponse(responseConfig: DownstreamResponseConfig): void;
  getReceivedRequests(): boolean;
};

function listen(app: ReturnType<typeof express>) {
  return new Promise<Server>((resolve) => {
    const stubServer = app.listen(Number(downstreamUrl.port), downstreamUrl.hostname, () => {
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

export function createDownstreamStubServer(): DownstreamStubServer {
  const app = express();
  let receivedRequests = false;
  let loginResponse: DownstreamResponseConfig | null = null;
  let server: Server | undefined;

  app.use(express.json());

  app.post(endpoints.loginEndpoint, (_request, response: Response) => {
    receivedRequests = true;

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
      receivedRequests = false;
      loginResponse = null;
    },
    setLoginResponse(responseConfig: DownstreamResponseConfig) {
      loginResponse = responseConfig;
    },
    getReceivedRequests() {
      return receivedRequests;
    },
  };
}
