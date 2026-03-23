import { expect, test as base } from "@playwright/test";

import {
  createDownstreamStubServer,
  DownstreamStubServer,
} from "../helpers/downstreamServer";

type Fixtures = {
  downstreamStub: DownstreamStubServer;
};

type WorkerFixtures = {
  workerDownstreamStub: DownstreamStubServer;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
  workerDownstreamStub: [
    async ({}, use) => {
      const downstreamStub = createDownstreamStubServer();
      await downstreamStub.start();
      await use(downstreamStub);
      await downstreamStub.stop();
    },
    { scope: "worker" },
  ],
  downstreamStub: async ({ workerDownstreamStub }, use) => {
    workerDownstreamStub.reset();
    await use(workerDownstreamStub);
  },
});

export { expect };
