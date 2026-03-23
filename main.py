import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
import uvicorn

from config import get_settings

config = get_settings()
app = FastAPI()


@app.api_route("/{path:path}", methods=["POST"])
async def proxy_request(request: Request, path: str) -> JSONResponse:
    url = f"http://{config.PROXY_TARGET_HOST}:{config.PROXY_TARGET_PORT}/{path}"
    try:
        body = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON") from exc

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Request body must be a JSON object")

    if "user" not in body:
        raise HTTPException(status_code=400, detail="Missing 'user' key in request body")

    async with httpx.AsyncClient() as client:
        response = await client.request(method=request.method, url=url, json=body)
        return process_response(response=response)


def process_response(response: httpx.Response) -> JSONResponse:
    try:
        body = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=400, detail="Downstream response body must be valid JSON"
        ) from exc

    if not isinstance(body, dict):
        raise HTTPException(
            status_code=400, detail="Downstream response body must be a JSON object"
        )

    if "user" not in body:
        raise HTTPException(status_code=400, detail="Missing 'user' key in response body")

    body.pop("customer", None)
    return JSONResponse(content=body, status_code=response.status_code)


def main():
    uvicorn.run(app, host=config.PROXY_SERVICE_HOST, port=config.PROXY_SERVICE_PORT)


if __name__ == "__main__":
    main()
