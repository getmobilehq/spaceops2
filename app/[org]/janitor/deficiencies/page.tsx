import { createClient } from "@/lib/supabase/server"
import { getMyDeficiencies } from "@/lib/queries/deficiencies"
import { notFound } from "next/navigation"
import { JanitorDeficiencyList } from "./janitor-deficiency-list"

export const metadata = {
  title: "My Deficiencies - SpaceOps",
}

export default async function JanitorDeficienciesPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "janitor") return notFound()

  const deficiencies = await getMyDeficiencies(supabase, user.id)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-brand">My Deficiencies</h1>
        <p className="text-sm text-muted-foreground">
          Issues that need your attention
        </p>
      </div>
      <JanitorDeficiencyList
        deficiencies={deficiencies}
        orgSlug={params.org}
      />
    </div>
  )
}
