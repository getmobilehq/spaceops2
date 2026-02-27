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
import { Badge } from "@/components/ui/badge"

interface BuildingWithRelations {
  id: string
  name: string
  address: string
  status: string
  clients: { company_name: string } | null
  floors: { id: string }[]
}

const statusConfig: Record<
  string,
  { variant: "default" | "secondary" | "outline" | "destructive"; className?: string }
> = {
  setup: { variant: "outline", className: "border-amber-200 bg-amber-50 text-amber-700" },
  active: { variant: "outline", className: "border-green-200 bg-green-50 text-green-700" },
  inactive: { variant: "destructive" },
}

export function BuildingTable({
  buildings,
  orgSlug,
}: {
  buildings: BuildingWithRelations[]
  orgSlug: string
}) {
  const router = useRouter()

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Floors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buildings.map((building) => {
            const status = statusConfig[building.status] || { variant: "outline" as const }
            return (
              <TableRow
                key={building.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/${orgSlug}/admin/buildings/${building.id}`)
                }
              >
                <TableCell className="font-medium">{building.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {building.address}
                </TableCell>
                <TableCell>
                  {building.clients?.company_name || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant} className={status.className}>
                    {building.status.charAt(0).toUpperCase() +
                      building.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{building.floors.length}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
