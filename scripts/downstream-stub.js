const http = require("node:http");

const port = Number(process.env.DOWNSTREAM_PORT || 8085);
const requests = [];
const scenarios = new Map();

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let raw = "";

    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => resolve(raw));
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = request.url || "/";

  if (url === "/__admin/reset" && request.method === "POST") {
    requests.length = 0;
    scenarios.clear();
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url === "/__admin/requests" && request.method === "GET") {
    sendJson(response, 200, { requests });
    return;
  }

  if (url === "/__admin/scenarios" && request.method === "POST") {
    const rawBody = await collectBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};

    scenarios.set(payload.path, {
      status: payload.status ?? 200,
      headers: payload.headers ?? {},
      jsonBody: payload.jsonBody,
      rawBody: payload.rawBody,
    });

    sendJson(response, 200, { ok: true });
    return;
  }

  const rawBody = await collectBody(request);
  const record = {
    method: request.method,
    path: url,
    headers: request.headers,
    rawBody,
  };

  try {
    record.jsonBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    record.jsonBody = null;
  }

  requests.push(record);

  const scenario = scenarios.get(url);
  if (!scenario) {
    sendJson(response, 404, { error: `No stub configured for ${url}` });
    return;
  }

  if (scenario.rawBody !== undefined) {
    response.writeHead(scenario.status, scenario.headers);
    response.end(scenario.rawBody);
    return;
  }

  response.writeHead(scenario.status, {
    "content-type": "application/json",
    ...scenario.headers,
  });
  response.end(JSON.stringify(scenario.jsonBody ?? {}));
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Downstream stub listening on ${port}\n`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
