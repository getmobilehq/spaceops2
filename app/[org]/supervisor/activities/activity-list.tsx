"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Calendar, Clock, MapPin, RefreshCw, ArrowUp, ArrowDown } from "lucide-react"
import { ActivityStatusBadge } from "@/components/shared/ActivityStatusBadge"

interface ActivityData {
  id: string
  name: string
  status: string
  scheduled_date: string
  window_start: string
  window_end: string
  source_template_id: string | null
  floors: {
    floor_name: string
    building_id: string
    buildings: { name: string } | null
  } | null
  room_tasks: { id: string }[]
}

export function ActivityList({
  activities,
  orgSlug,
}: {
  activities: ActivityData[]
  orgSlug: string
}) {
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<"date" | "name" | "status">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const filtered = useMemo(() => {
    const result = activities.filter((a) => {
      if (dateFilter && a.scheduled_date !== dateFilter) return false
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      return true
    })

    const statusOrder: Record<string, number> = { active: 0, draft: 1, closed: 2, cancelled: 3 }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date":
          cmp = a.scheduled_date.localeCompare(b.scheduled_date)
          break
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "status":
          cmp = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
          break
      }
      return sortDirection === "asc" ? cmp : -cmp
    })

    return result
  }, [activities, dateFilter, statusFilter, sortField, sortDirection])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-44"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sortField}
          onValueChange={(v) => setSortField(v as "date" | "name" | "status")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="status">Sort by Status</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
          title={sortDirection === "asc" ? "Ascending" : "Descending"}
        >
          {sortDirection === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
        <div className="flex-1" />
        <Button asChild>
          <Link href={`/${orgSlug}/supervisor/activities/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Activity
          </Link>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No activities found. Create one to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((activity) => (
            <Link
              key={activity.id}
              href={`/${orgSlug}/supervisor/activities/${activity.id}`}
              className="flex items-center justify-between rounded-md border p-4 hover:bg-muted transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {activity.source_template_id && (
                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <p className="font-medium">{activity.name}</p>
                  <ActivityStatusBadge status={activity.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {activity.floors?.buildings?.name} · {activity.floors?.floor_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {activity.scheduled_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.window_start.slice(0, 5)} – {activity.window_end.slice(0, 5)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {activity.room_tasks.length} room{activity.room_tasks.length !== 1 ? "s" : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
