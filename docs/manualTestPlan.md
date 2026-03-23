# Manual Test Plan

This service can be tested manually with two terminals and either curl or API development tools like Insomnia .

## Setup

1. Install dependencies:

```bash
uv sync
npm install
```

>uv sync installs the Python project dependencies and syncs your environment to match the project definition.


2. In terminal 1, start a temporary downstream stub. Set `DOWNSTREAM_MODE` before the command to switch scenarios:

```bash
DOWNSTREAM_MODE=valid uv run python - <<'PY'
import os

from fastapi import FastAPI, Response
import uvicorn

app = FastAPI()
mode = os.environ.get("DOWNSTREAM_MODE", "valid")


@app.post("/api/login")
async def login():
    if mode == "invalid-json":
        return Response(content="not-json", media_type="application/json", status_code=200)
    if mode == "json-string":
        return Response(content='"ok"', media_type="application/json", status_code=200)
    if mode == "missing-user":
        return {"token": "abc123xyz"}
    if mode == "created":
        return Response(
            content='{"user":40,"token":"created-token"}',
            media_type="application/json",
            status_code=201,
        )
    return {"user": 40, "token": "abc123xyz", "expiresIn": 3600}


uvicorn.run(app, host="127.0.0.1", port=8085)
PY
```

3. In terminal 2, start the proxy:

```bash
uv run main.py
```

The proxy runs on `http://127.0.0.1:8000`.

## Happy Path

Send:

```bash
curl -i http://127.0.0.1:8000/api/login \
  -H 'content-type: application/json' \
  -d '{"user":40,"password":"12345"}'
```

Expect:

- Status `200`
- JSON body `{"token":"abc123xyz","expiresIn":3600}`
- The `user` field is removed from the downstream response

## Negative Checks

### Invalid JSON request body

Send:

```bash
curl -i http://127.0.0.1:8000/api/login \
  -H 'content-type: application/json' \
  -d '{"user":40'
```

Expect status `400` with `{"detail":"Request body must be valid JSON"}`.

### Valid JSON that is not an object

Send:

```bash
curl -i http://127.0.0.1:8000/api/login \
  -H 'content-type: application/json' \
  -d '"user=40"'
```

Expect status `400` with `{"detail":"Request body must be a JSON object"}`.

### Missing user in request

Send:

```bash
curl -i http://127.0.0.1:8000/api/login \
  -H 'content-type: application/json' \
  -d '{"password":"12345"}'
```

Expect status `400` with `{"detail":"Missing 'user' key in request body"}`.

## Downstream Response Checks

Restart the downstream stub with one of the following `DOWNSTREAM_MODE` values, then resend the happy-path proxy request.

- `DOWNSTREAM_MODE=missing-user`
  Expect status `400` with `{"detail":"Missing 'user' key in response body"}`.

- `DOWNSTREAM_MODE=invalid-json`
  Expect status `400` with `{"detail":"Downstream response body must be valid JSON"}`.

- `DOWNSTREAM_MODE=json-string`
  Expect status `400` with `{"detail":"Downstream response body must be a JSON object"}`.

- `DOWNSTREAM_MODE=created`
  Expect status `201` with `{"token":"created-token"}`.

## Suggested Manual QA Flow

1. Run the happy path first to confirm the proxy and downstream stub are both reachable.
2. Validate the three request-side failures.
3. Restart the downstream stub for each downstream mode and confirm the proxy error handling.
4. Finish with the `created` scenario to verify the downstream status code is preserved.
