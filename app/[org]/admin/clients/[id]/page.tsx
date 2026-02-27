import { createClient } from "@/lib/supabase/server"
import { getClientById } from "@/lib/queries/clients"
import { notFound } from "next/navigation"
import { EditClientForm } from "./edit-client-form"

export const metadata = {
  title: "Edit Client - SpaceOps",
}

export default async function EditClientPage({
  params,
}: {
  params: { org: string; id: string }
}) {
  const supabase = createClient()

  let client
  try {
    client = await getClientById(supabase, params.id)
  } catch {
    return notFound()
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand">Edit Client</h1>
        <p className="text-muted-foreground">
          Update client details
        </p>
      </div>
      <EditClientForm client={client} orgSlug={params.org} />
    </div>
  )
}
