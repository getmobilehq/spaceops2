import { createClient } from "@/lib/supabase/server"
import { getOrgDeficiencies } from "@/lib/queries/deficiencies"
import { notFound } from "next/navigation"
import { DeficiencyList } from "./deficiency-list"

export const metadata = {
  title: "Deficiencies - SpaceOps",
}

export default async function DeficienciesPage({
  params,
  searchParams,
}: {
  params: { org: string }
  searchParams: { status?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  const role = user.app_metadata?.role as string | undefined
  if (role !== "admin" && role !== "supervisor") return notFound()

  const status = searchParams.status || "all"
  const deficiencies = await getOrgDeficiencies(supabase, status)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Deficiencies</h1>
        <p className="text-muted-foreground">
          Track and manage inspection issues
        </p>
      </div>
      <DeficiencyList
        deficiencies={deficiencies}
        orgSlug={params.org}
        currentFilter={status}
      />
    </div>
  )
}
