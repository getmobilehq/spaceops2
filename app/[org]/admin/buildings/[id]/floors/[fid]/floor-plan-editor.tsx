"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Save, RotateCcw } from "lucide-react"
import { updateRoomPin } from "@/actions/rooms"

interface Room {
  id: string
  name: string
  pin_x: number | null
  pin_y: number | null
  room_types: { name: string } | null
}

const PIN_SIZE = 28

export function FloorPlanEditor({
  rooms,
  floorPlanUrl,
}: {
  rooms: Room[]
  floorPlanUrl: string | null
}) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [pins, setPins] = useState<Record<string, { x: number; y: number }>>(
    () => {
      const initial: Record<string, { x: number; y: number }> = {}
      for (const r of rooms) {
        if (r.pin_x !== null && r.pin_y !== null) {
          initial[r.id] = { x: r.pin_x, y: r.pin_y }
        }
      }
      return initial
    }
  )
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const unplacedRooms = rooms.filter((r) => !pins[r.id])

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedRoom || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPins((prev) => ({ ...prev, [selectedRoom]: { x, y } }))
    setDirty(true)
    setSelectedRoom(null)
  }

  function handleRemovePin(roomId: string) {
    setPins((prev) => {
      const next = { ...prev }
      delete next[roomId]
      return next
    })
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    const updates = rooms.map((r) => {
      const pin = pins[r.id]
      return updateRoomPin({
        roomId: r.id,
        pinX: pin ? pin.x : null,
        pinY: pin ? pin.y : null,
      })
    })
    await Promise.all(updates)
    setSaving(false)
    setDirty(false)
    router.refresh()
  }

  if (!floorPlanUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Floor Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a floor plan image above to enable room placement.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Room Placement</CardTitle>
        <div className="flex gap-2">
          {dirty && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save Positions"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {selectedRoom && (
          <div className="rounded-md border border-brand/30 bg-brand/5 p-2 text-sm text-brand">
            Click on the floor plan to place{" "}
            <strong>
              {rooms.find((r) => r.id === selectedRoom)?.name}
            </strong>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 text-xs"
              onClick={() => setSelectedRoom(null)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Floor plan with pins */}
        <div
          ref={containerRef}
          className="relative border rounded-lg overflow-hidden cursor-crosshair bg-muted"
          onClick={handleMapClick}
          style={{ aspectRatio: "4/3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={floorPlanUrl}
            alt="Floor plan"
            className="w-full h-full object-contain"
            draggable={false}
          />

          {/* Room pins */}
          {Object.entries(pins).map(([roomId, pos]) => {
            const room = rooms.find((r) => r.id === roomId)
            if (!room) return null
            return (
              <div
                key={roomId}
                className="absolute flex flex-col items-center group"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <MapPin className="h-7 w-7 text-brand fill-brand/20 drop-shadow" />
                  <button
                    className="absolute -top-1 -right-3 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]"
                    onClick={() => handleRemovePin(roomId)}
                    title="Remove pin"
                  >
                    x
                  </button>
                </div>
                <span className="text-[10px] font-medium bg-white/90 px-1 rounded shadow whitespace-nowrap">
                  {room.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Unplaced rooms */}
        {unplacedRooms.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Unplaced rooms — click a room then click on the map:
            </p>
            <div className="flex flex-wrap gap-2">
              {unplacedRooms.map((r) => (
                <Button
                  key={r.id}
                  variant={selectedRoom === r.id ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedRoom(r.id)}
                >
                  {r.name}
                  {r.room_types && (
                    <span className="ml-1 opacity-60">
                      ({r.room_types.name})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {unplacedRooms.length === 0 && rooms.length > 0 && (
          <p className="text-xs text-muted-foreground">
            All rooms placed. Hover over a pin and click x to remove.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
