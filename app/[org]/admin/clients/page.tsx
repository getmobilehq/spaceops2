import { createClient } from "@/lib/supabase/server"
import { getOrgClients } from "@/lib/queries/clients"
import { ClientTable } from "./client-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const metadata = {
  title: "Clients - SpaceOps",
}

export default async function ClientsPage({
  params,
}: {
  params: { org: string }
}) {
  const supabase = createClient()
  const clients = await getOrgClients(supabase)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand">Clients</h1>
          <p className="text-muted-foreground">
            Manage your building owner clients
          </p>
        </div>
        <Link href={`/${params.org}/admin/clients/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No clients yet. Add your first client to get started.
          </p>
          <Link href={`/${params.org}/admin/clients/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        </div>
      ) : (
        <ClientTable clients={clients} orgSlug={params.org} />
      )}
    </div>
  )
}
