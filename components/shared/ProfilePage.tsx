import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileForm } from "./ProfileForm"

export async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const { data: userRecord } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  // The public.users profile row can be absent for an otherwise-valid
  // authenticated user (e.g. created in auth without a profile row). Fall
  // back to auth metadata instead of 404-ing, matching how OrgLayout /
  // OrgProvider tolerate a missing row everywhere else in the app.
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  const firstName =
    userRecord?.first_name ?? (meta.first_name as string) ?? ""
  const lastName = userRecord?.last_name ?? (meta.last_name as string) ?? ""
  const role =
    userRecord?.role ?? (user.app_metadata?.role as string) ?? ""
  const avatarUrl =
    userRecord?.avatar_url ?? (meta.avatar_url as string) ?? null
  const createdAt = userRecord?.created_at ?? user.created_at

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information and security
        </p>
      </div>
      <ProfileForm
        firstName={firstName}
        lastName={lastName}
        email={user.email || ""}
        role={role}
        avatarUrl={avatarUrl}
        memberSince={new Date(createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      />
    </div>
  )
}
