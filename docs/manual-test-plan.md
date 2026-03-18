# Manual Test Plan

## Goal

Validate that the proxy:

1. Accepts only JSON request bodies.
2. Rejects requests that do not contain `user`.
3. Requires JSON responses from the downstream service.
4. Rejects downstream responses that do not contain `user`.
5. Removes `user` from successful downstream responses before returning them.

## Test Environment

- Start the proxy service on `http://127.0.0.1:8000`.
- Start a controllable downstream stub on `http://127.0.0.1:8085`.
- Use Postman, Insomnia, or `curl` for the requests.

## Core Manual Scenarios

1. Happy path
   Configure the downstream service to return `{"user":40,"token":"abc123xyz","expires_in":3600}` for `POST /api/login`.
   Send `POST /api/login` to the proxy with `{"user":40,"password":"12345"}`.
   Expect `200 OK` and body `{"token":"abc123xyz","expires_in":3600}`.

2. Missing `user` in request
   Send `POST /api/login` with `{"password":"12345"}`.
   Expect `400 Bad Request`.
   Confirm the downstream service received no request.

3. Invalid JSON in request
   Send `POST /api/login` with `Content-Type: application/json` and malformed raw body such as `{"user":40`.
   Expect `400 Bad Request`.

4. Downstream response missing `user`
   Configure the downstream service to return `{"token":"abc123xyz"}`.
   Send a valid proxy request.
   Expect `400 Bad Request`.

5. Request body is JSON but not an object
   Send `POST /api/login` with a JSON string body such as `"user=40"`.
   Expect `400 Bad Request`.

6. Downstream response is not JSON
   Configure the downstream service to return plain text such as `ok`.
   Send a valid proxy request.
   Expect `400 Bad Request`.

7. Downstream response is JSON but not an object
   Configure the downstream service to return a JSON string such as `"ok"`.
   Send a valid proxy request.
   Expect `400 Bad Request`.

8. Path forwarding
   Configure a second route such as `POST /api/profile`.
   Send a valid proxy request to `/api/profile`.
   Confirm the downstream service receives the same path and method.

9. Status-code passthrough
   Configure the downstream service to return `201` with a valid JSON body containing `user`.
   Send a valid proxy request.
   Expect the proxy to return `201` and still remove `user` from the body.

## Useful Curl Examples

```bash
curl -i \
  -X POST http://127.0.0.1:8000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"user":40,"password":"12345"}'
```

```bash
curl -i \
  -X POST http://127.0.0.1:8000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"password":"12345"}'
```

## What To Watch For

- The proxy should never expose the `user` field on a successful response.
- Validation failures should be deterministic and easy to diagnose.
- The downstream request should not be triggered when the proxy rejects the incoming body.
