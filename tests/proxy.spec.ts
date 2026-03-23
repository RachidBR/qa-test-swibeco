import {
  downstreamResponseBodies,
  downstreamResponseConfigs,
  invalidLoginRequestBodies,
  loginRequestBodies,
  proxyResponseBodies,
  proxyRoutes,
} from "../data/proxy-test-data";
import { expect, test } from "@playwright/test";
import { createDownstreamStubServer } from "../helpers/create-downstream-stub-server";

const downstreamStub = createDownstreamStubServer();

test.beforeAll(async () => {
  await downstreamStub.start();
});

test.afterAll(async () => {
  await downstreamStub.stop();
});

test.beforeEach(() => {
  downstreamStub.reset();
});

test.describe("Incoming request rules", () => {
  test("rejects a request when the body is not valid JSON", async ({ request }) => {
    // GIVEN a malformed JSON request body
    // WHEN the client sends it to the proxy
    const response = await request.post(proxyRoutes.userLogin, {
      data: invalidLoginRequestBodies.malformedJsonRequestBody,
    });

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Request body must be valid JSON",
    });

    const forwardedRequests = downstreamStub.getForwardedRequests();
    expect(forwardedRequests).toHaveLength(0);
  });

  test("rejects a request when the body is not a JSON object", async ({ request }) => {
    // GIVEN a valid JSON value that is not an object
    // WHEN the client sends it to the proxy
    const response = await request.post(proxyRoutes.userLogin, {
      data: invalidLoginRequestBodies.jsonStringRequestBody,
    });

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Request body must be a JSON object",
    });

    const forwardedRequests = downstreamStub.getForwardedRequests();
    expect(forwardedRequests).toHaveLength(0);
  });

  test("rejects a request when user is missing from the body", async ({ request }) => {
    // GIVEN a JSON object without the required user field
    // WHEN the client sends it to the proxy
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithoutUser,
    });

    // THEN the proxy rejects the request before calling downstream
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Missing 'user' key in request body",
    });

    const forwardedRequests = downstreamStub.getForwardedRequests();
    expect(forwardedRequests).toHaveLength(0);
  });

  test("forwards a valid request to the downstream service", async ({ request }) => {
    // GIVEN a valid downstream response
    downstreamStub.setLoginResponse({
      body: downstreamResponseBodies.loginResponseWithUser,
    });

    // WHEN the client sends a valid request to the proxy
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });

    // THEN the proxy returns a successful response
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(proxyResponseBodies.loginResponseWithoutUser);

    // THEN the original request is forwarded downstream
    const forwardedRequests = downstreamStub.getForwardedRequests();
    expect(forwardedRequests).toHaveLength(1);
    expect(forwardedRequests[0]).toMatchObject({
      method: "POST",
      path: proxyRoutes.userLogin,
      body: loginRequestBodies.loginRequestWithUser,
    });
  });
});

test.describe("Downstream response rules", () => {
  test("rejects the downstream response when it is not valid JSON", async ({ request }) => {
    // GIVEN a downstream response that is not valid JSON
    downstreamStub.setLoginResponse(downstreamResponseConfigs.invalidJsonResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });

    // THEN the proxy rejects the invalid downstream response
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Downstream response body must be valid JSON",
    });
  });

  test("rejects the downstream response when it is not a JSON object", async ({
    request,
  }) => {
    // GIVEN a downstream response that is valid JSON but not an object
    downstreamStub.setLoginResponse(downstreamResponseConfigs.jsonStringResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });

    // THEN the proxy rejects the invalid downstream response shape
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Downstream response body must be a JSON object",
    });
  });

  test("rejects the downstream response when user is missing", async ({ request }) => {
    // GIVEN a downstream JSON object without the required user field
    downstreamStub.setLoginResponse({
      body: downstreamResponseBodies.loginResponseWithoutUser,
    });

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });

    // THEN the proxy rejects the downstream response
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({
      detail: "Missing 'user' key in response body",
    });
  });

  test("returns the downstream payload without the user field", async ({ request }) => {
    // GIVEN a valid downstream response containing user and business data
    downstreamStub.setLoginResponse({
      body: downstreamResponseBodies.loginResponseWithUser,
    });

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });


    // THEN the proxy removes user and returns the remaining fields
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(proxyResponseBodies.loginResponseWithoutUser);
  });

  test("keeps the downstream status code on a valid response", async ({ request }) => {
    // GIVEN a valid downstream response with a custom success status
    downstreamStub.setLoginResponse(downstreamResponseConfigs.createdResponse);

    // WHEN the proxy forwards a valid request to downstream
    const response = await request.post(proxyRoutes.userLogin, {
      data: loginRequestBodies.loginRequestWithUser,
    });

    // THEN the proxy keeps the downstream status while still removing user
    expect(response.status()).toBe(201);
    expect(await response.json()).toEqual(proxyResponseBodies.createdLoginResponseWithoutUser);
  });
});
