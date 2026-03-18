# Simple Proxy Service

This is a simple proxy service, which proxies any POST request coming in to downstream server.

Following are the technical requirements:

1. The proxy expects a json request body
2. The json body should always contain a key called "user" else it should throw an error and return 400
3. The proxy expects a json response body from downstream server
4. The response json body from downstream server should always contain a key called "user" else it should throw an error and return 400.
5. The "user" key from the response body will be removed and rest of the body will be returned from proxy server

## Requirements:

1. Python version: 3.12
2. uv installed: https://docs.astral.sh/uv/getting-started/installation/
3. `uv sync`to create and install dependencies
4. Service configuration can be found in `config.py`

## Run the service:

```
uv run main.py
```

You should see following:

```
INFO: Started server process [50724]
INFO: Waiting for application startup.
INFO: Application startup complete.
INFO: Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
```

## Example:

```
POST http://localhost:8000/api/login
Request Body:
{
    "user": 40,
    "password": "12345"
}

Response Body:
{
  "token": "abc123xyz",
  "expires_in": 3600
}
```

## Exercise

1. Please write automation tests for the above requirements. You can use any langugage or framework you are comfortable in.

2. Please also propose how can this service be tested manually.

## Solution Summary

- Automated tests are implemented with Playwright in TypeScript.
- The tests run the FastAPI proxy together with a controllable downstream stub so the scenarios are exercised end to end.
- A manual QA checklist is available in [docs/manual-test-plan.md](./docs/manual-test-plan.md).
- A short submission walkthrough is available in [docs/submission-notes.md](./docs/submission-notes.md).

## Run The Automated Tests

### 1. Install Python dependencies

Using `uv`:

```bash
uv sync
```

Or using `pip`:

```bash
python3 -m venv .venv
./.venv/bin/pip install -e .
```

### 2. Install Playwright dependencies

```bash
npm install
```

### 3. Execute the test suite

```bash
npm test
```

## What Is Covered

The Playwright suite validates:

1. Successful request forwarding to the downstream service.
2. Rejection when the request body does not contain `user`.
3. Rejection when the request body is not valid JSON.
4. Rejection when the request body is valid JSON but not an object.
5. Rejection when the downstream response does not contain `user`.
6. Rejection when the downstream response is not valid JSON.
7. Rejection when the downstream response is valid JSON but not an object.
8. Response transformation that removes the `user` field.
9. Preservation of the downstream status code after transformation.

## Notes On Approach

- I used Playwright because the role is frontend-web focused and Playwright gives a good path from API-level coverage today to browser-level scenarios later.
- The test suite is written as API tests because the exercise is a proxy service, not a browser UI.
- The downstream dependency is managed through a Playwright fixture and a local stub so the tests stay deterministic and request-forwarding assertions remain explicit.
- Test data is centralized under `tests/data`, while reusable test behavior lives under `tests/helpers` and `tests/fixtures`.

## Tips:

1. What is a proxy: https://en.wikipedia.org/wiki/Proxy_server
2. You might need to create a downstream service for your testing ( see `config.py`, `PROXY_TARGET_HOST` and `PROXY_TARGET_PORT` to configure proxy to connect to downstream service)
