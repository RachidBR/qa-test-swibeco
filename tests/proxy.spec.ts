import { proxyRequestCases, proxyResponses, proxyRoutes } from "./data/proxy-data";
import { expectJsonResponse, expectNoDownstreamCalls } from "./helpers/proxy-assertions";
import { expect, test } from "./fixtures/proxy-fixtures";

test("forwards the request downstream and strips the user field from the response", async ({
  downstreamAdmin,
  request,
}) => {
  await downstreamAdmin.configureJsonScenario(
    proxyRoutes.login,
    proxyRequestCases.happyPath.downstreamResponse,
  );

  const response = await request.post(proxyRoutes.login, {
    data: proxyRequestCases.happyPath.requestBody,
  });

  await expectJsonResponse(response, 200, proxyResponses.loginSuccess);

  const recordedRequests = await downstreamAdmin.recordedRequests();
  expect(recordedRequests).toHaveLength(1);
  expect(recordedRequests[0]).toMatchObject({
    method: "POST",
    path: proxyRoutes.login,
    jsonBody: proxyRequestCases.happyPath.requestBody,
  });
});

for (const invalidRequestCase of proxyRequestCases.invalidRequests) {
  test(invalidRequestCase.name, async ({ downstreamAdmin, request }) => {
    const response = await request.post(proxyRoutes.login, invalidRequestCase.requestOptions);

    await expectJsonResponse(response, 400, {
      detail: invalidRequestCase.expectedDetail,
    });
    await expectNoDownstreamCalls(downstreamAdmin);
  });
}

for (const invalidDownstreamCase of proxyRequestCases.invalidDownstreamResponses) {
  test(invalidDownstreamCase.name, async ({ downstreamAdmin, request }) => {
    await downstreamAdmin.configureScenario(
      proxyRoutes.login,
      invalidDownstreamCase.downstreamScenario,
    );

    const response = await request.post(proxyRoutes.login, {
      data: proxyRequestCases.happyPath.requestBody,
    });

    await expectJsonResponse(response, 400, {
      detail: invalidDownstreamCase.expectedDetail,
    });
  });
}

test("preserves the downstream status code after transforming the body", async ({
  downstreamAdmin,
  request,
}) => {
  await downstreamAdmin.configureJsonScenario(
    proxyRoutes.login,
    proxyRequestCases.createdResponse.downstreamResponse,
    proxyRequestCases.createdResponse.status,
  );

  const response = await request.post(proxyRoutes.login, {
    data: proxyRequestCases.createdResponse.requestBody,
  });

  await expectJsonResponse(response, proxyRequestCases.createdResponse.status, {
    token: "created-token",
  });
});
