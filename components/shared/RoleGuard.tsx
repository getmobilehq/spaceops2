import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getDefaultPathForRole } from "@/lib/utils"

interface RoleGuardProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export async function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const role = user.app_metadata?.role as string
  const orgSlug = user.app_metadata?.org_slug as string

  if (!role || !orgSlug) {
    redirect("/auth/login?error=no_role")
  }

  if (!allowedRoles.includes(role)) {
    redirect(getDefaultPathForRole(orgSlug, role))
  }

  return <>{children}</>
}
