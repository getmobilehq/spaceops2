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
import { Plus, Calendar, Clock, MapPin } from "lucide-react"
import { ActivityStatusBadge } from "@/components/shared/ActivityStatusBadge"

interface ActivityData {
  id: string
  name: string
  status: string
  scheduled_date: string
  window_start: string
  window_end: string
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

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (dateFilter && a.scheduled_date !== dateFilter) return false
      if (statusFilter !== "all" && a.status !== statusFilter) return false
      return true
    })
  }, [activities, dateFilter, statusFilter])

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
