import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/auth/constants";

export function proxy(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isProtected =
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/employee") ||
    request.nextUrl.pathname.startsWith("/change-password");

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/employee/:path*", "/change-password"],
};
