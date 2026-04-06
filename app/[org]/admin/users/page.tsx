import { createClient } from "@/lib/supabase/server"
import { getOrgUsers } from "@/lib/queries/users"
import { getAuthUsersForOrg } from "@/lib/queries/admin-users"
import { UserTable } from "./user-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTranslations } from "@/lib/i18n/server"

export const metadata = {
  title: "Users - SpaceOps",
}

export default async function UsersPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [users, { t }] = await Promise.all([
    getOrgUsers(supabase),
    getTranslations(),
  ])

  const authData = await getAuthUsersForOrg(users.map((u) => u.id))

  const usersWithAuth = users.map((u) => ({
    ...u,
    email: authData[u.id]?.email ?? null,
    lastSignInAt: authData[u.id]?.last_sign_in_at ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin.users.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.users.subtitle")}
          </p>
        </div>
        <Link href={`/${params.org}/admin/users/invite`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.users.inviteUser")}
          </Button>
        </Link>
      </div>

      {usersWithAuth.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("admin.users.empty")}
          </p>
          <Link href={`/${params.org}/admin/users/invite`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.users.inviteUser")}
            </Button>
          </Link>
        </div>
      ) : (
        <UserTable users={usersWithAuth} orgSlug={params.org} />
      )}
    </div>
  )
}
