import type { IncomingMessage, ServerResponse } from "node:http";
import { dynamicClientRegistrationResponse, publicBaseUrl } from "../../src/oauth.js";

async function readJson(req: IncomingMessage & { body?: unknown }): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
}

export default async function handler(req: IncomingMessage & { body?: unknown; headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  if (req.method !== "POST") {
    res.writeHead(405, { allow: "POST" });
    res.end("Method not allowed");
    return;
  }
  const body = await readJson(req);
  res.writeHead(201, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(dynamicClientRegistrationResponse(publicBaseUrl(req), body)));
}
