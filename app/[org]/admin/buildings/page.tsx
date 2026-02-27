import { createClient } from "@/lib/supabase/server"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { BuildingTable } from "./building-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const metadata = {
  title: "Buildings - SpaceOps",
}

export default async function BuildingsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const buildings = await getOrgBuildings(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Buildings</h1>
          <p className="text-muted-foreground">
            Manage your buildings and floors
          </p>
        </div>
        <Link href={`/${params.org}/admin/buildings/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Building
          </Button>
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No buildings yet. Create your first building to get started.
          </p>
          <Link href={`/${params.org}/admin/buildings/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Building
            </Button>
          </Link>
        </div>
      ) : (
        <BuildingTable buildings={buildings} orgSlug={params.org} />
      )}
    </div>
  )
}
