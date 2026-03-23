import {
  createdDownstreamResponse,
  createdProxyResponse,
  downstreamResponseWithoutUser,
  invalidJsonDownstreamResponse,
  jsonStringDownstreamResponse,
  jsonStringRequest,
  loginPath,
  loginSuccessResponse,
  malformedJsonRequest,
  requestWithoutUser,
  validDownstreamLoginResponse,
  validLoginRequest,
} from "../data/proxy-test-data";
import { expect, test } from "../fixtures/downstream-fixtures";

test.describe("Request body validation", () => {
  test("Request body must be valid JSON", async ({ downstreamAdmin, request }) => {
    // GIVEN a malformed JSON request body
    // WHEN the client sends it to the proxy
    const response = await request.post(loginPath, malformedJsonRequest);

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Request body must be valid JSON",
    });

    const recordedRequests = await downstreamAdmin.recordedRequests();
    expect(recordedRequests).toHaveLength(0);
  });

  test("Request body must be a JSON object", async ({ downstreamAdmin, request }) => {
    // GIVEN a valid JSON value that is not an object
    // WHEN the client sends it to the proxy
    const response = await request.post(loginPath, jsonStringRequest);

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Request body must be a JSON object",
    });

    const recordedRequests = await downstreamAdmin.recordedRequests();
    expect(recordedRequests).toHaveLength(0);
  });

  test("Missing 'user' key in request body", async ({ downstreamAdmin, request }) => {
    // GIVEN a JSON object without the required user field
    // WHEN the client sends it to the proxy
    const response = await request.post(loginPath, {
      data: requestWithoutUser,
    });

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Missing 'user' key in request body",
    });

    const recordedRequests = await downstreamAdmin.recordedRequests();
    expect(recordedRequests).toHaveLength(0);
  });

  test("Valid request is forwarded to the downstream service", async ({
    downstreamAdmin,
    request,
  }) => {
    // GIVEN a valid downstream response
    await downstreamAdmin.configureScenario(loginPath, {
      jsonBody: validDownstreamLoginResponse,
    });

    // WHEN the client sends a valid request to the proxy
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy returns a successful response
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(loginSuccessResponse);

    // THEN the original request is forwarded downstream
    const recordedRequests = await downstreamAdmin.recordedRequests();
    expect(recordedRequests).toHaveLength(1);
    expect(recordedRequests[0]).toMatchObject({
      method: "POST",
      path: loginPath,
      jsonBody: validLoginRequest,
    });
  });
});

test.describe("Downstream response validation", () => {
  test("Downstream response body must be valid JSON", async ({
    downstreamAdmin,
    request,
  }) => {
    // GIVEN a downstream response that is not valid JSON
    await downstreamAdmin.configureScenario(loginPath, invalidJsonDownstreamResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy rejects the invalid downstream response
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Downstream response body must be valid JSON",
    });
  });

  test("Downstream response body must be a JSON object", async ({
    downstreamAdmin,
    request,
  }) => {
    // GIVEN a downstream response that is valid JSON but not an object
    await downstreamAdmin.configureScenario(loginPath, jsonStringDownstreamResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy rejects the invalid downstream response shape
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Downstream response body must be a JSON object",
    });
  });

  test("Missing 'user' key in response body", async ({ downstreamAdmin, request }) => {
    // GIVEN a downstream JSON object without the required user field
    await downstreamAdmin.configureScenario(loginPath, {
      jsonBody: downstreamResponseWithoutUser,
    });

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy rejects the downstream response
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Missing 'user' key in response body",
    });
  });

  test("Valid downstream response removes 'user' before returning to the client", async ({
    downstreamAdmin,
    request,
  }) => {
    // GIVEN a valid downstream response containing user and business data
    await downstreamAdmin.configureScenario(loginPath, {
      jsonBody: validDownstreamLoginResponse,
    });

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy removes user and returns the remaining fields
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(loginSuccessResponse);
  });

  test("Valid downstream response keeps the downstream status code", async ({
    downstreamAdmin,
    request,
  }) => {
    // GIVEN a valid downstream response with a custom success status
    await downstreamAdmin.configureScenario(loginPath, createdDownstreamResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(loginPath, {
      data: validLoginRequest,
    });

    // THEN the proxy keeps the downstream status while still removing user
    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual(createdProxyResponse);
  });
});
