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

  if (!userRecord) return notFound()

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
        firstName={userRecord.first_name}
        lastName={userRecord.last_name}
        email={user.email || ""}
        role={userRecord.role}
        avatarUrl={userRecord.avatar_url}
        memberSince={new Date(userRecord.created_at).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "long", year: "numeric" }
        )}
      />
    </div>
  )
}
