export const requests = {
  validRequestBodies: {
    loginWithUser: {
      user: 40,
      password: "12345",
    },
  },
  invalidLoginRequestBodies: {
    loginWithoutUser: {
      password: "12345",
    },
    malformedJsonBody: '{"user":40',
    jsonStringBody: '"user=40"',
  },
};

export const downstreamResponses = {
  valid: {
    responseBodies: {
      loginWithUser: {
        user: 40,
        token: "abc123xyz",
        expiresIn: 3600,
      },
      createdLoginWithUser: {
        user: 40,
        token: "created-token",
      },
    },
    responseConfigs: {
      created: {
        status: 201,
        body: {
          user: 40,
          token: "the returned token",
        },
      },
    },
  },
  invalid: {
    responseBodies: {
      loginWithoutUser: {
        token: "abc123xyz",
      },
    },
    responseConfigs: {
      invalidJson: {
        body: "hello im not a json object",
      },
      jsonString: {
        body: '"ok"',
      },
    },
  },
};

export const proxyResponses = {
  responseBodies: { 
    loginWithoutUser: {
      token: "abc123xyz",
      expiresIn: 3600,
    },
    createdLoginWithoutUser: {
      token: "the returned token",
    },
  },
};
