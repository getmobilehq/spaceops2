import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")
  const origin = requestUrl.origin

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Invite flow: recovery link generated during user invite
    if (type === "invite") {
      return NextResponse.redirect(`${origin}/auth/invite`)
    }

    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/new-password`)
    }

    if (type === "signup") {
      return NextResponse.redirect(`${origin}/auth/invite`)
    }
  }

  // Default: redirect to root (middleware handles role routing)
  return NextResponse.redirect(`${origin}/`)
}
