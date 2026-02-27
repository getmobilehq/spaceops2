import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const publicPatterns = ["/auth", "/scan", "/_next", "/favicon.ico", "/api/health"]

function isPublicRoute(pathname: string): boolean {
  return publicPatterns.some((pattern) => pathname.startsWith(pattern))
}

function getDefaultPath(orgSlug: string, role: string): string {
  switch (role) {
    case "admin":
      return `/${orgSlug}/admin/dashboard`
    case "supervisor":
      return `/${orgSlug}/supervisor/dashboard`
    case "janitor":
      return `/${orgSlug}/janitor/today`
    case "client":
      return `/${orgSlug}/client/overview`
    default:
      return "/auth/login"
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Always refresh the session (updates cookies)
  const { user, supabaseResponse } = await updateSession(request)

  // 2. Public routes — pass through
  if (isPublicRoute(pathname)) {
    // Already logged in on login page → redirect to dashboard
    if (pathname.startsWith("/auth/login") && user) {
      const role = user.app_metadata?.role as string | undefined
      const orgSlug = user.app_metadata?.org_slug as string | undefined
      if (role && orgSlug) {
        const url = request.nextUrl.clone()
        url.pathname = getDefaultPath(orgSlug, role)
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // 3. No session on protected route → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // 4. Extract role and org from JWT
  const role = user.app_metadata?.role as string | undefined
  const orgSlug = user.app_metadata?.org_slug as string | undefined

  if (!role || !orgSlug) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("error", "no_role")
    return NextResponse.redirect(url)
  }

  // 5. Root path → role-appropriate dashboard
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultPath(orgSlug, role)
    return NextResponse.redirect(url)
  }

  // 6. Validate org slug from URL
  const segments = pathname.split("/").filter(Boolean)
  const urlOrgSlug = segments[0]

  if (urlOrgSlug !== orgSlug) {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultPath(orgSlug, role)
    return NextResponse.redirect(url)
  }

  // 7. Check route prefix matches user role
  const routeRole = segments[1]
  const allowedRoles: Record<string, string[]> = {
    admin: ["admin", "supervisor"],
    supervisor: ["supervisor"],
    janitor: ["janitor"],
    client: ["client"],
  }
  const userAllowedRoles = allowedRoles[role] || []

  if (routeRole && !userAllowedRoles.includes(routeRole)) {
    const url = request.nextUrl.clone()
    url.pathname = getDefaultPath(orgSlug, role)
    return NextResponse.redirect(url)
  }

  // 8. All checks passed
  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
