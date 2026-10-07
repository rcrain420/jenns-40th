import { headers } from "next/headers";
import { getAppUrl } from "./config.ts";
import { lineGuessEntryPath } from "./line-guess-format.ts";

const HOST_RE = /^[a-z0-9.-]+(?::\d+)?$/i;

/** Origin the visitor is actually on, so a printed QR matches that host. */
export async function lineGuessPublicOrigin(): Promise<string> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(",")[0]
    ?.trim();
  if (!host || !HOST_RE.test(host)) return getAppUrl();

  const protoHeader = (h.get("x-forwarded-proto") ?? "").split(",")[0]?.trim();
  const proto =
    protoHeader === "http" || protoHeader === "https"
      ? protoHeader
      : host.startsWith("localhost") || host.startsWith("127.")
        ? "http"
        : "https";
  return `${proto}://${host}`;
}

export async function lineGuessEntryUrl(token: string): Promise<string> {
  const origin = await lineGuessPublicOrigin();
  return `${origin}${lineGuessEntryPath(token)}`;
}
