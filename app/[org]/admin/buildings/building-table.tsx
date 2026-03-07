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
import { BUILDING_STATUS } from "@/lib/status-styles"

interface BuildingWithRelations {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  status: string
  clients: { company_name: string } | null
  floors: { id: string }[]
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
    <div className="rounded-lg border bg-card">
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
            const status = BUILDING_STATUS[building.status]
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
                  {building.city ? `, ${building.city}` : ""}
                  {building.state ? `, ${building.state}` : ""}
                </TableCell>
                <TableCell>
                  {building.clients?.company_name || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={status?.className}>
                    {status?.label ?? building.status.charAt(0).toUpperCase() + building.status.slice(1)}
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
