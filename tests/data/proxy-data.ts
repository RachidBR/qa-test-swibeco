import type { APIRequestOptions } from "../helpers/proxy-types";

export const proxyRoutes = {
  login: "/api/login",
} as const;

export const proxyResponses = {
  loginSuccess: {
    token: "abc123xyz",
    expires_in: 3600,
  },
} as const;

export const proxyRequestCases = {
  happyPath: {
    requestBody: {
      user: 40,
      password: "12345",
    },
    downstreamResponse: {
      user: 40,
      token: "abc123xyz",
      expires_in: 3600,
    },
  },
  createdResponse: {
    status: 201,
    requestBody: {
      user: 40,
      password: "12345",
    },
    downstreamResponse: {
      user: 40,
      token: "created-token",
    },
  },
  invalidRequests: [
    {
      name: "returns 400 when the request body does not include user",
      requestOptions: {
        data: {
          password: "12345",
        },
      } satisfies APIRequestOptions,
      expectedDetail: "Missing 'user' key in request body",
    },
    {
      name: "returns 400 when the request body is not valid json",
      requestOptions: {
        data: Buffer.from('{"user":40'),
        headers: {
          "content-type": "application/json",
        },
      } satisfies APIRequestOptions,
      expectedDetail: "Request body must be valid JSON",
    },
    {
      name: "returns 400 when the request body is valid json but not an object",
      requestOptions: {
        data: Buffer.from('"user=40"'),
        headers: {
          "content-type": "application/json",
        },
      } satisfies APIRequestOptions,
      expectedDetail: "Request body must be a JSON object",
    },
  ],
  invalidDownstreamResponses: [
    {
      name: "returns 400 when the downstream response is missing user",
      downstreamScenario: {
        jsonBody: {
          token: "abc123xyz",
        },
      },
      expectedDetail: "Missing 'user' key in response body",
    },
    {
      name: "returns 400 when the downstream response is not valid json",
      downstreamScenario: {
        headers: {
          "content-type": "text/plain",
        },
        rawBody: "not-json",
      },
      expectedDetail: "Downstream response body must be valid JSON",
    },
    {
      name: "returns 400 when the downstream response is valid json but not an object",
      downstreamScenario: {
        headers: {
          "content-type": "application/json",
        },
        rawBody: '"ok"',
      },
      expectedDetail: "Downstream response body must be a JSON object",
    },
  ],
} as const;
