"use client"

import { RoomBlock } from "./room-block"
import type { ExtractedRoom } from "@/lib/validations/vectorisation"

interface SpatialBlockMapProps {
  floorPlanUrl: string
  rooms: ExtractedRoom[]
  selectedRoomId: string | null
  matchedRoomIds: Set<string>
  onSelectRoom: (tempId: string) => void
}

export function SpatialBlockMap({
  floorPlanUrl,
  rooms,
  selectedRoomId,
  matchedRoomIds,
  onSelectRoom,
}: SpatialBlockMapProps) {
  return (
    <div
      className="relative border rounded-lg overflow-hidden bg-muted"
      style={{ aspectRatio: "4/3" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={floorPlanUrl}
        alt="Floor plan"
        className="w-full h-full object-contain"
        draggable={false}
      />

      {/* Room blocks overlay */}
      {rooms.map((room) => (
        <RoomBlock
          key={room.tempId}
          room={room}
          isSelected={selectedRoomId === room.tempId}
          isMatched={matchedRoomIds.has(room.tempId)}
          onClick={() => onSelectRoom(room.tempId)}
        />
      ))}
    </div>
  )
}
