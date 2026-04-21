import { NextRequest, NextResponse } from "next/server";

type ProxyRouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

export const dynamic = "force-dynamic";

const REQUEST_HEADER_ALLOWLIST = new Set([
  "accept",
  "authorization",
  "content-type",
  "x-account-id",
  "x-session-token",
]);

function getBackendBaseUrl(): string {
  const configuredBaseUrl =
    process.env.API_BASE_URL?.replace(/\/$/, "") ??
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    (process.env.NODE_ENV === "development" ? "http://localhost:8001/api/v1" : "");

  if (!configuredBaseUrl) {
    throw new Error("API_BASE_URL is not configured for this deployment.");
  }

  return configuredBaseUrl;
}

async function proxyRequest(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  const backendBaseUrl = getBackendBaseUrl();
  const query = request.nextUrl.search;
  const targetUrl = `${backendBaseUrl}/${path.join("/")}${query}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (REQUEST_HEADER_ALLOWLIST.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const responseContentType = upstreamResponse.headers.get("content-type");

  if (responseContentType) {
    responseHeaders.set("content-type", responseContentType);
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: ProxyRouteContext,
): Promise<NextResponse> {
  return proxyRequest(request, context);
}
