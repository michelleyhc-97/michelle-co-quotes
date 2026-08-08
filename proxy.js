import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Everything in this app requires a login session EXCEPT:
// - /login (the login page itself)
// - /api/login (the login endpoint)
// - /q/* (the public, customer-facing quote view — customers don't have accounts)
// - /api/notify-amendment (called from that public page, to email the team)
// - /api/public/* (the scoped, single-quote read/respond API that page uses —
//   deliberately separate from /api/quotes, which exposes the full list)
function isPublicPath(pathname) {
  return (
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname === "/api/notify-amendment" ||
    pathname.startsWith("/q/") ||
    pathname.startsWith("/api/public/")
  );
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const user = verifySessionToken(token);

  if (user) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
