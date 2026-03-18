import { APIRequestContext, expect, test } from "@playwright/test";

const stubBaseUrl = "http://127.0.0.1:8085";

async function configureScenario(
  request: APIRequestContext,
  payload: {
    path: string;
    status?: number;
    headers?: Record<string, string>;
    jsonBody?: unknown;
    rawBody?: string;
  },
) {
  const response = await request.post(`${stubBaseUrl}/__admin/scenarios`, {
    data: payload,
  });

  expect(response.ok()).toBeTruthy();
}

async function fetchRecordedRequests(
  request: APIRequestContext,
) {
  const response = await request.get(`${stubBaseUrl}/__admin/requests`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as {
    requests: Array<{
      method: string;
      path: string;
      jsonBody: Record<string, unknown> | null;
      rawBody: string;
    }>;
  };
}

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${stubBaseUrl}/__admin/reset`);
  expect(response.ok()).toBeTruthy();
});

test("forwards the request downstream and strips the user field from the response", async ({
  request,
}) => {
  await configureScenario(request, {
    path: "/api/login",
    jsonBody: {
      user: 40,
      token: "abc123xyz",
      expires_in: 3600,
    },
  });

  const response = await request.post("/api/login", {
    data: {
      user: 40,
      password: "12345",
    },
  });

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({
    token: "abc123xyz",
    expires_in: 3600,
  });

  const downstreamRequests = await fetchRecordedRequests(request);
  expect(downstreamRequests.requests).toHaveLength(1);
  expect(downstreamRequests.requests[0]).toMatchObject({
    method: "POST",
    path: "/api/login",
    jsonBody: {
      user: 40,
      password: "12345",
    },
  });
});

test("returns 400 when the request body does not include user", async ({ request }) => {
  const response = await request.post("/api/login", {
    data: {
      password: "12345",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Missing 'user' key in request body",
  });

  const downstreamRequests = await fetchRecordedRequests(request);
  expect(downstreamRequests.requests).toHaveLength(0);
});

test("returns 400 when the request body is not valid json", async ({ request }) => {
  const response = await request.post("/api/login", {
    data: Buffer.from('{"user":40'),
    headers: {
      "content-type": "application/json",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Request body must be valid JSON",
  });
});

test("returns 400 when the request body is valid json but not an object", async ({ request }) => {
  const response = await request.post("/api/login", {
    data: Buffer.from('"user=40"'),
    headers: {
      "content-type": "application/json",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Request body must be a JSON object",
  });

  const downstreamRequests = await fetchRecordedRequests(request);
  expect(downstreamRequests.requests).toHaveLength(0);
});

test("returns 400 when the downstream response is missing user", async ({ request }) => {
  await configureScenario(request, {
    path: "/api/login",
    jsonBody: {
      token: "abc123xyz",
    },
  });

  const response = await request.post("/api/login", {
    data: {
      user: 40,
      password: "12345",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Missing 'user' key in response body",
  });
});

test("returns 400 when the downstream response is not valid json", async ({ request }) => {
  await configureScenario(request, {
    path: "/api/login",
    headers: {
      "content-type": "text/plain",
    },
    rawBody: "not-json",
  });

  const response = await request.post("/api/login", {
    data: {
      user: 40,
      password: "12345",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Downstream response body must be valid JSON",
  });
});

test("returns 400 when the downstream response is valid json but not an object", async ({ request }) => {
  await configureScenario(request, {
    path: "/api/login",
    headers: {
      "content-type": "application/json",
    },
    rawBody: '"ok"',
  });

  const response = await request.post("/api/login", {
    data: {
      user: 40,
      password: "12345",
    },
  });

  expect(response.status()).toBe(400);
  expect(await response.json()).toEqual({
    detail: "Downstream response body must be a JSON object",
  });
});

test("preserves the downstream status code after transforming the body", async ({ request }) => {
  await configureScenario(request, {
    path: "/api/login",
    status: 201,
    jsonBody: {
      user: 40,
      token: "created-token",
    },
  });

  const response = await request.post("/api/login", {
    data: {
      user: 40,
      password: "12345",
    },
  });

  expect(response.status()).toBe(201);
  expect(await response.json()).toEqual({
    token: "created-token",
  });
});
