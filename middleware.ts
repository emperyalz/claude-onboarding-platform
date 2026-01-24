import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (
      req.nextauth.token &&
      (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login and register pages without auth
        if (
          req.nextUrl.pathname === "/login" ||
          req.nextUrl.pathname === "/register"
        ) {
          return true;
        }
        // Require auth for dashboard and profile pages
        if (
          req.nextUrl.pathname.startsWith("/dashboard") ||
          req.nextUrl.pathname.startsWith("/profile") ||
          req.nextUrl.pathname.startsWith("/responses")
        ) {
          return !!token;
        }
        // Allow all other pages
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/responses/:path*",
    "/login",
    "/register",
  ],
};
