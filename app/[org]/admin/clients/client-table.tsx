"use client"

import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ClientWithBuildings {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  created_at: string
  buildings: { id: string }[]
}

export function ClientTable({
  clients,
  orgSlug,
}: {
  clients: ClientWithBuildings[]
  orgSlug: string
}) {
  const router = useRouter()

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Buildings</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow
              key={client.id}
              className="cursor-pointer"
              onClick={() =>
                router.push(`/${orgSlug}/admin/clients/${client.id}`)
              }
            >
              <TableCell className="font-medium">
                {client.company_name}
              </TableCell>
              <TableCell>{client.contact_name}</TableCell>
              <TableCell className="text-muted-foreground">
                {client.contact_email}
              </TableCell>
              <TableCell>{client.buildings.length}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
