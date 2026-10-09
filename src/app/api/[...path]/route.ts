import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (!["auth", "projects", "health", "testnet"].includes(path[0]))
    return Response.json({ message: "Not found." }, { status: 404 });
  const base = process.env.BACKEND_URL ?? "http://127.0.0.1:4000";
  const headers = new Headers();
  for (const name of [
    "content-type",
    "cookie",
    "origin",
    "x-accordbridge-request",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(
      `${base}/api/${path.map(encodeURIComponent).join("/")}`,
      {
        method: request.method,
        headers,
        body: ["GET", "HEAD"].includes(request.method)
          ? undefined
          : await request.text(),
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(15000),
      },
    );
    const responseHeaders = new Headers({
      "content-type":
        upstream.headers.get("content-type") ?? "application/json",
      "cache-control": "no-store",
    });
    for (const cookie of upstream.headers.getSetCookie())
      responseHeaders.append("set-cookie", cookie);
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    // Do not retry proxy writes. A timeout after a submission may mean the
    // upstream processed it even though its response was lost.
    const read = request.method === "GET" || request.method === "HEAD";
    return Response.json(
      {
        code: "UPSTREAM_UNAVAILABLE",
        outcome: read ? "read_unavailable" : "unknown",
        message: read
          ? "The workspace service is unavailable (it may be starting). Your entered work remains on this page. Use Check connection to retry a safe read."
          : "The service did not return a response. This action may have succeeded. Do not submit it again until you check its saved or on-chain state.",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT };
