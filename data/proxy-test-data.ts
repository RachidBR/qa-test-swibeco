import type { APIRequestOptions } from "../helpers/proxy-types";

export const loginPath = "/api/login";

export const validLoginRequest = {
  user: 40,
  password: "12345",
};

export const requestWithoutUser = {
  password: "12345",
};

export const malformedJsonRequest: APIRequestOptions = {
  data: Buffer.from('{"user":40'),
  headers: {
    "content-type": "application/json",
  },
};

export const jsonStringRequest: APIRequestOptions = {
  data: Buffer.from('"user=40"'),
  headers: {
    "content-type": "application/json",
  },
};

export const validDownstreamLoginResponse = {
  user: 40,
  token: "abc123xyz",
  expires_in: 3600,
};

export const loginSuccessResponse = {
  token: "abc123xyz",
  expires_in: 3600,
};

export const downstreamResponseWithoutUser = {
  token: "abc123xyz",
};

export const invalidJsonDownstreamResponse = {
  headers: {
    "content-type": "text/plain",
  },
  rawBody: "not-json",
};

export const jsonStringDownstreamResponse = {
  headers: {
    "content-type": "application/json",
  },
  rawBody: '"ok"',
};

export const createdDownstreamResponse = {
  status: 201,
  jsonBody: {
    user: 40,
    token: "created-token",
  },
};

export const createdProxyResponse = {
  token: "created-token",
};
