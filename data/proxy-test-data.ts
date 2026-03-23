
export const loginRequestBodies = {
  loginRequestWithUser: {
    user: 40,
    password: "12345",
  },
  loginRequestWithoutUser: {
    password: "12345",
  },
};

export const invalidLoginRequestBodies = {
  malformedJsonRequestBody: '{"user":40',
  jsonStringRequestBody: '"user=40"',
};

export const downstreamResponseBodies = {
  loginResponseWithUser: {
    user: 40,
    token: "abc123xyz",
    expiresIn: 3600,
  },
  loginResponseWithoutUser: {
    token: "abc123xyz",
  },
  createdLoginResponseWithUser: {
    user: 40,
    token: "created-token",
  },
};

export const proxyResponseBodies = {
  loginResponseWithoutUser: {
    token: "abc123xyz",
    expiresIn: 3600,
  },
  createdLoginResponseWithoutUser: {
    token: "the returned token",
  },
};

export const downstreamResponseConfigs = {
  invalidJsonResponse: {
    body: "hello im not a json object",
  },
  jsonStringResponse: {
    body: '"ok"',
  },
  createdResponse: {
    status: 201,
    body: {
      user: 40,
      token: "the returned token",
    },
  },
};
