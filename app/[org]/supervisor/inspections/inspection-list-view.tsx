"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createInspection } from "@/actions/inspections"
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Layers,
  DoorOpen,
  Plus,
} from "lucide-react"

interface InspectionData {
  id: string
  status: string
  notes: string | null
  inspected_at: string | null
  created_at: string
  rooms: { name: string; room_types: { name: string } | null } | null
  floors: { floor_name: string } | null
  buildings: { name: string } | null
}

interface BuildingWithRooms {
  id: string
  name: string
  address: string
  floors: {
    id: string
    floorName: string
    rooms: { id: string; name: string; roomType: string }[]
  }[]
}

interface InspectionStats {
  total: number
  pending: number
  passed: number
  failed: number
}

export function InspectionListView({
  inspections,
  buildings,
  stats,
  orgSlug,
}: {
  inspections: InspectionData[]
  buildings: BuildingWithRooms[]
  stats: InspectionStats
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")

  // Cascading selectors
  const [selectedBuildingId, setSelectedBuildingId] = useState("")
  const [selectedFloorId, setSelectedFloorId] = useState("")
  const [selectedRoomId, setSelectedRoomId] = useState("")

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId)
  const selectedFloor = selectedBuilding?.floors.find(
    (f) => f.id === selectedFloorId
  )

  const filtered = useMemo(() => {
    if (statusFilter === "all") return inspections
    return inspections.filter((i) => i.status === statusFilter)
  }, [inspections, statusFilter])

  async function handleStartInspection() {
    if (!selectedBuildingId || !selectedFloorId || !selectedRoomId) return
    setIsCreating(true)

    const result = await createInspection({
      buildingId: selectedBuildingId,
      floorId: selectedFloorId,
      roomId: selectedRoomId,
    })

    if (result.success) {
      toast({ title: "Inspection started" })
      router.push(`/${orgSlug}/supervisor/inspections/${result.id}`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCreating(false)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-warning/30 bg-warning/10 text-warning"
          >
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "passed":
        return (
          <Badge
            variant="outline"
            className="border-success/30 bg-success/10 text-success"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        )
      case "failed":
        return (
          <Badge
            variant="outline"
            className="border-destructive/30 bg-destructive/10 text-destructive"
          >
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-success">{stats.passed}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-destructive">
              {stats.failed}
            </p>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Start New Inspection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Start New Inspection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No buildings assigned. Contact your admin.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Building */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    Building
                  </label>
                  <Select
                    value={selectedBuildingId}
                    onValueChange={(v) => {
                      setSelectedBuildingId(v)
                      setSelectedFloorId("")
                      setSelectedRoomId("")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Floor */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5" />
                    Floor
                  </label>
                  <Select
                    value={selectedFloorId}
                    onValueChange={(v) => {
                      setSelectedFloorId(v)
                      setSelectedRoomId("")
                    }}
                    disabled={!selectedBuildingId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedBuilding?.floors.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.floorName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <DoorOpen className="h-3.5 w-3.5" />
                    Room
                  </label>
                  <Select
                    value={selectedRoomId}
                    onValueChange={setSelectedRoomId}
                    disabled={!selectedFloorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedFloor?.rooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                          {r.roomType ? ` (${r.roomType})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleStartInspection}
                disabled={
                  !selectedBuildingId ||
                  !selectedFloorId ||
                  !selectedRoomId ||
                  isCreating
                }
              >
                <ClipboardCheck className="mr-2 h-4 w-4" />
                {isCreating ? "Starting..." : "Start Inspection"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Inspection List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Inspection History</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No inspections found.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((inspection) => (
                <Link
                  key={inspection.id}
                  href={`/${orgSlug}/supervisor/inspections/${inspection.id}`}
                  className="flex items-center justify-between rounded-md border p-4 hover:bg-muted transition-colors"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {inspection.rooms?.name || "Unknown Room"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {inspection.buildings?.name || "Unknown"} ·{" "}
                        {inspection.floors?.floor_name || "Unknown"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(inspection.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  {statusBadge(inspection.status)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
