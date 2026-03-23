import { expect, test as base } from "@playwright/test";

import {
  createDownstreamStubServer,
  DownstreamStubServer,
} from "../helpers/downstreamServer";

type Fixtures = {
  downstreamStub: DownstreamStubServer;
};

export const test = base.extend<Fixtures>({
  downstreamStub: async ({}, use) => {
    const downstreamStub = createDownstreamStubServer();
    await downstreamStub.start();
    downstreamStub.reset();
    await use(downstreamStub);
    await downstreamStub.stop();
  },
});

export { expect };
