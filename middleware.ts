import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthed   = request.cookies.get("crm_auth")?.value === "true";
  const { pathname } = request.nextUrl;
  const isPublic   = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  // Unauthenticated → always send to login
  if (!isAuthed && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already authed and hitting auth pages → send to dashboard
  if (isAuthed && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|.*\\.svg).*)"],
};
