export type RequestHeaders = Record<string, string>;

export type APIRequestOptions = {
  data?: Buffer | Record<string, unknown>;
  headers?: RequestHeaders;
};

export type DownstreamScenario = {
  path: string;
  status?: number;
  headers?: RequestHeaders;
  jsonBody?: unknown;
  rawBody?: string;
};

export type RecordedRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
  jsonBody: Record<string, unknown> | null;
};
