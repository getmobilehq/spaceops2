import { createClient } from "@/lib/supabase/server"
import { getOrgClients } from "@/lib/queries/clients"
import { ClientTable } from "./client-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { getTranslations } from "@/lib/i18n/server"

export const metadata = {
  title: "Clients - SpaceOps",
}

export default async function ClientsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const [clients, { t }] = await Promise.all([
    getOrgClients(supabase),
    getTranslations(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin.clients.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.clients.subtitle")}
          </p>
        </div>
        <Link href={`/${params.org}/admin/clients/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("admin.clients.addClient")}
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("admin.clients.empty")}
          </p>
          <Link href={`/${params.org}/admin/clients/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.clients.addClient")}
            </Button>
          </Link>
        </div>
      ) : (
        <ClientTable clients={clients} orgSlug={params.org} />
      )}
    </div>
  )
}
