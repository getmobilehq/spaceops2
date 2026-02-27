import { createClient } from "@/lib/supabase/server"
import { getBuildingById, getOrgSupervisors } from "@/lib/queries/buildings"
import { getOrgClients } from "@/lib/queries/clients"
import { notFound } from "next/navigation"
import { BuildingDetailForm } from "./building-detail-form"

export const metadata = {
  title: "Building Detail - SpaceOps",
}

export default async function BuildingDetailPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let building
  try {
    building = await getBuildingById(supabase, params.id)
  } catch {
    return notFound()
  }

  const [supervisors, clients] = await Promise.all([
    getOrgSupervisors(supabase),
    getOrgClients(supabase),
  ])

  const clientOptions = clients.map((c) => ({
    id: c.id,
    companyName: c.company_name,
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">{building.name}</h1>
        <p className="text-muted-foreground">{building.address}</p>
      </div>
      <BuildingDetailForm
        building={building}
        supervisors={supervisors}
        clients={clientOptions}
        orgSlug={params.org}
      />
    </div>
  )
}
