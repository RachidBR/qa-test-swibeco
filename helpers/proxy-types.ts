export type DownstreamResponseConfig = {
  status?: number;
  body?: unknown;
};

export type ForwardedRequest = {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body: Record<string, unknown> | null;
};
