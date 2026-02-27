import { createClient } from "@/lib/supabase/server"
import { getUserById } from "@/lib/queries/users"
import { getAuthUserEmail } from "@/lib/queries/admin-users"
import { notFound } from "next/navigation"
import { EditUserForm } from "./edit-user-form"

export const metadata = {
  title: "Edit User - SpaceOps",
}

export default async function EditUserPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let user
  try {
    user = await getUserById(supabase, params.id)
  } catch {
    return notFound()
  }

  const email = await getAuthUserEmail(params.id)

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Edit User</h1>
        <p className="text-muted-foreground">
          Update user details and permissions
        </p>
      </div>
      <EditUserForm user={user} email={email} orgSlug={params.org} />
    </div>
  )
}
