import type { APIResponse } from "@playwright/test";

import { expect } from "../fixtures/proxy-fixtures";
import type { createDownstreamAdmin } from "./downstream-admin";

type DownstreamAdmin = ReturnType<typeof createDownstreamAdmin>;

export async function expectJsonResponse(
  response: APIResponse,
  expectedStatus: number,
  expectedBody: unknown,
) {
  expect(response.status()).toBe(expectedStatus);
  expect(await response.json()).toEqual(expectedBody);
}

export async function expectNoDownstreamCalls(downstreamAdmin: DownstreamAdmin) {
  await expect(downstreamAdmin.recordedRequests()).resolves.toHaveLength(0);
}
