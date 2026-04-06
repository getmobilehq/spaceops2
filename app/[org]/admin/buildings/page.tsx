import { createClient } from "@/lib/supabase/server"
import { getOrgBuildings } from "@/lib/queries/buildings"
import { BuildingTable } from "./building-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTranslations } from "@/lib/i18n/server"

export const metadata = {
  title: "Buildings - SpaceOps",
}

export default async function BuildingsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [buildings, { t }] = await Promise.all([
    getOrgBuildings(supabase),
    getTranslations(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin.buildings.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.buildings.subtitle")}
          </p>
        </div>
        <Link href={`/${params.org}/admin/buildings/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.buildings.newBuilding")}
          </Button>
        </Link>
      </div>

      {buildings.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("admin.buildings.empty")}
          </p>
          <Link href={`/${params.org}/admin/buildings/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.buildings.newBuilding")}
            </Button>
          </Link>
        </div>
      ) : (
        <BuildingTable buildings={buildings} orgSlug={params.org} />
      )}
    </div>
  )
}
