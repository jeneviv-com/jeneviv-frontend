/**
 * Next.js Middleware for authentication and authorization
 */

import { NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/signup"];

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/dashboard",
  "/collections",
  "/transactions",
  "/refunds",
  "/payment-links",
  "/settings",
  "/notifications",
  "/templates",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected) {
    // Check for session cookie
    const sessionCookie = request.cookies.get(
      "better-auth.session_token",
    )?.value;

    if (!sessionCookie) {
      // Redirect to login
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
