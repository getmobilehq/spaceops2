import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

const publicPatterns = ["/auth", "/register", "/scan", "/_next", "/favicon.ico", "/api/health", "/api/cron", "/api/webhooks", "/api/v1", "/api/docs"]

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

  // Set pathname header so server components can read it via headers()
  request.headers.set("x-pathname", pathname)

  // Locale detection
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value
  const acceptLang = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0]
  const supportedLocales = ["en", "es", "fr"]
  const locale = supportedLocales.includes(cookieLocale ?? "") ? cookieLocale!
    : supportedLocales.includes(acceptLang ?? "") ? acceptLang!
    : "en"
  request.headers.set("x-locale", locale)

  // 1. Always refresh the session (updates cookies)
  const { user, supabaseResponse } = await updateSession(request)

  // Helper: create a redirect that preserves session cookies from supabaseResponse
  function redirectTo(destination: string) {
    const url = request.nextUrl.clone()
    url.pathname = destination
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value)
    })
    return redirect
  }

  function redirectToUrl(url: URL) {
    const redirect = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value)
    })
    return redirect
  }

  // 2. Public routes — pass through
  if (isPublicRoute(pathname)) {
    // Already logged in on login page → redirect to dashboard
    if (pathname.startsWith("/auth/login") && user) {
      const role = user.app_metadata?.role as string | undefined
      const orgSlug = user.app_metadata?.org_slug as string | undefined
      if (role && orgSlug) {
        return redirectTo(getDefaultPath(orgSlug, role))
      }
    }
    return supabaseResponse
  }

  // 3. No session on protected route → login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("next", pathname)
    return redirectToUrl(url)
  }

  // 4. Extract role and org from JWT
  const role = user.app_metadata?.role as string | undefined
  const orgSlug = user.app_metadata?.org_slug as string | undefined

  if (!role || !orgSlug) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("error", "no_role")
    return redirectToUrl(url)
  }

  // 5. Force password change for invited users
  const mustChangePassword = user.app_metadata?.must_change_password === true
  if (mustChangePassword && !pathname.startsWith("/auth/new-password")) {
    return redirectTo("/auth/new-password")
  }

  // 6. Root path → role-appropriate dashboard
  if (pathname === "/") {
    return redirectTo(getDefaultPath(orgSlug, role))
  }

  // 5b. Platform (super-admin) routes
  if (pathname.startsWith("/platform")) {
    const isSuperAdmin = user.app_metadata?.is_super_admin === true
    if (!isSuperAdmin) {
      return redirectTo(getDefaultPath(orgSlug, role))
    }
    return supabaseResponse
  }

  // 6. Validate org slug from URL
  const segments = pathname.split("/").filter(Boolean)
  const urlOrgSlug = segments[0]

  if (urlOrgSlug !== orgSlug) {
    return redirectTo(getDefaultPath(orgSlug, role))
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
    return redirectTo(getDefaultPath(orgSlug, role))
  }

  // 8. All checks passed
  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
