import { createClient } from "@/lib/supabase/server"
import { getOrgClients } from "@/lib/queries/clients"
import { BuildingWizard } from "./building-wizard"

export const metadata = {
  title: "New Building - SpaceOps",
}

export default async function NewBuildingPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const clients = await getOrgClients(supabase)

  const clientOptions = clients.map((c) => ({
    id: c.id,
    companyName: c.company_name,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">New Building</h1>
        <p className="text-muted-foreground">
          Set up a new building with floors
        </p>
      </div>
      <BuildingWizard clients={clientOptions} orgSlug={params.org} />
    </div>
  )
}
