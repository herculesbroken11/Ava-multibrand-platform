import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveBrandFromRequestHeaders, trustForwardedHostEnabled } from "@/lib/brand";

export function middleware(request: NextRequest) {
  const brand = resolveBrandFromRequestHeaders({
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    trustForwardedHost: trustForwardedHostEnabled(),
  });

  if (!brand) {
    return new NextResponse("Unknown host", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": "noindex",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
