import type { IncomingMessage, ServerResponse } from "node:http";
import { authorizationServerMetadata, publicBaseUrl } from "../../src/oauth.js";

export default function handler(req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(authorizationServerMetadata(publicBaseUrl(req))));
}
