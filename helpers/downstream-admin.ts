import type { APIRequestContext } from "@playwright/test";

import type { DownstreamScenario, RecordedRequest } from "./proxy-types";
import { downstreamBaseUrl } from "./test-config";

export function createDownstreamAdmin(request: APIRequestContext) {
  return {
    async reset() {
      const response = await request.post(`${downstreamBaseUrl}/__admin/reset`);
      if (!response.ok()) {
        throw new Error("Unable to reset downstream stub state");
      }
    },
    async configureScenario(path: string, scenario: Omit<DownstreamScenario, "path">) {
      const response = await request.post(`${downstreamBaseUrl}/__admin/scenarios`, {
        data: {
          path,
          ...scenario,
        },
      });

      if (!response.ok()) {
        throw new Error(`Unable to configure downstream scenario for ${path}`);
      }
    },
    async recordedRequests(): Promise<RecordedRequest[]> {
      const response = await request.get(`${downstreamBaseUrl}/__admin/requests`);
      if (!response.ok()) {
        throw new Error("Unable to fetch downstream recorded requests");
      }

      const body = (await response.json()) as { requests: RecordedRequest[] };
      return body.requests;
    },
  };
}
