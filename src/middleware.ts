import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  // Not authenticated → redirect to signin
  if (!token) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as string | undefined;

  // LEADERSHIP-only routes
  if ((pathname.startsWith("/leadership") || pathname.startsWith("/admin")) && role !== "LEADERSHIP") {
    if (role === "MEMBER") {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // MEMBER users hitting /dashboard → redirect to /portal
  if (pathname.startsWith("/dashboard") && role === "MEMBER") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // Non-MEMBER users hitting /portal → redirect to /dashboard
  if (pathname.startsWith("/portal") && role !== "MEMBER") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Tier 2 MEMBER users cannot access /portal/reports
  if (
    pathname.startsWith("/portal/reports") &&
    role === "MEMBER" &&
    token.portalTier === 2
  ) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/portal/:path*", "/leadership/:path*", "/admin/:path*"],
};
