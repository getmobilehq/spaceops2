"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh"

interface RoomWithStatus {
  id: string
  name: string
  pin_x: number | null
  pin_y: number | null
  is_active: boolean
  room_types: { name: string } | null
  taskStatus: string | null
}

const statusConfig: Record<
  string,
  { label: string; pinColor: string; fillColor: string }
> = {
  not_started: {
    label: "Not Started",
    pinColor: "text-gray-400",
    fillColor: "fill-gray-200",
  },
  in_progress: {
    label: "In Progress",
    pinColor: "text-yellow-500",
    fillColor: "fill-yellow-200",
  },
  done: {
    label: "Done",
    pinColor: "text-blue-500",
    fillColor: "fill-blue-200",
  },
  has_issues: {
    label: "Has Issues",
    pinColor: "text-red-500",
    fillColor: "fill-red-200",
  },
  inspected_pass: {
    label: "Passed",
    pinColor: "text-green-500",
    fillColor: "fill-green-200",
  },
  inspected_fail: {
    label: "Failed",
    pinColor: "text-red-600",
    fillColor: "fill-red-300",
  },
}

const defaultStatus = {
  label: "No Task",
  pinColor: "text-muted-foreground",
  fillColor: "fill-muted",
}

export function FloorPlanView({
  rooms,
  floorPlanUrl,
  floorName,
}: {
  rooms: RoomWithStatus[]
  floorPlanUrl: string | null
  floorName: string
}) {
  useRealtimeRefresh("room_tasks")

  const placedRooms = rooms.filter(
    (r) => r.pin_x !== null && r.pin_y !== null
  )
  const unplacedRooms = rooms.filter(
    (r) => r.pin_x === null || r.pin_y === null
  )

  if (!floorPlanUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No floor plan uploaded for this floor. Ask an admin to upload one.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs">
                <MapPin
                  className={`h-4 w-4 ${config.pinColor} ${config.fillColor}`}
                />
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Floor plan with pins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {floorName} — Live Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="relative border rounded-lg overflow-hidden bg-muted"
            style={{ aspectRatio: "4/3" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={floorPlanUrl}
              alt={`Floor plan for ${floorName}`}
              className="w-full h-full object-contain"
              draggable={false}
            />

            {/* Room pins */}
            {placedRooms.map((room) => {
              const status =
                statusConfig[room.taskStatus || ""] || defaultStatus
              return (
                <div
                  key={room.id}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${room.pin_x}%`,
                    top: `${room.pin_y}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <MapPin
                    className={`h-7 w-7 ${status.pinColor} ${status.fillColor} drop-shadow`}
                  />
                  <span className="text-[10px] font-medium bg-white/90 px-1 rounded shadow whitespace-nowrap">
                    {room.name}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Room list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Rooms ({rooms.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {rooms.map((room) => {
            const status =
              statusConfig[room.taskStatus || ""] || defaultStatus
            return (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-md border p-2"
              >
                <div className="flex items-center gap-2">
                  <MapPin
                    className={`h-4 w-4 ${status.pinColor} ${status.fillColor}`}
                  />
                  <span className="text-sm font-medium">{room.name}</span>
                  {room.room_types && (
                    <span className="text-xs text-muted-foreground">
                      ({room.room_types.name})
                    </span>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  {status.label}
                </Badge>
              </div>
            )
          })}

          {unplacedRooms.length > 0 && (
            <p className="text-xs text-muted-foreground pt-2">
              {unplacedRooms.length} room(s) not placed on the floor plan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
