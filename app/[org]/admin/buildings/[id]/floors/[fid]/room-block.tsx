"use client"

import { cn } from "@/lib/utils"
import type { ExtractedRoom } from "@/lib/validations/vectorisation"

const typeColors: Record<string, string> = {
  Office: "bg-blue-200/50 border-blue-400",
  Bathroom: "bg-purple-200/50 border-purple-400",
  Kitchen: "bg-orange-200/50 border-orange-400",
  "Meeting Room": "bg-green-200/50 border-green-400",
  Lobby: "bg-yellow-200/50 border-yellow-400",
  Stairwell: "bg-gray-200/50 border-gray-400",
  Storage: "bg-stone-200/50 border-stone-400",
  Corridor: "bg-slate-200/50 border-slate-400",
  Reception: "bg-amber-200/50 border-amber-400",
  "Server Room": "bg-cyan-200/50 border-cyan-400",
  Utility: "bg-zinc-200/50 border-zinc-400",
  "Open Plan": "bg-emerald-200/50 border-emerald-400",
  "Break Room": "bg-rose-200/50 border-rose-400",
  Other: "bg-neutral-200/50 border-neutral-400",
}

function getBlockColor(type: string): string {
  return typeColors[type] || typeColors.Other
}

interface RoomBlockProps {
  room: ExtractedRoom
  isSelected: boolean
  isMatched: boolean
  onClick: () => void
}

export function RoomBlock({
  room,
  isSelected,
  isMatched,
  onClick,
}: RoomBlockProps) {
  const colorClass = getBlockColor(room.detectedType)

  return (
    <div
      className={cn(
        "absolute border-2 rounded cursor-pointer transition-all flex items-center justify-center",
        colorClass,
        isSelected && "ring-2 ring-brand ring-offset-1 z-10",
        room.confidence === "low" && "border-dashed"
      )}
      style={{
        left: `${room.x - room.width / 2}%`,
        top: `${room.y - room.height / 2}%`,
        width: `${room.width}%`,
        height: `${room.height}%`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={`${room.label} (${room.detectedType}) - ${room.confidence} confidence`}
    >
      <div className="flex flex-col items-center gap-0.5 overflow-hidden px-1">
        <span className="text-[9px] font-semibold text-foreground/80 truncate max-w-full leading-tight">
          {room.label}
        </span>
        <span className="text-[8px] text-muted-foreground truncate max-w-full leading-tight">
          {room.detectedType}
        </span>
        {isMatched && (
          <span className="text-[8px] text-green-700 font-medium">Matched</span>
        )}
      </div>
    </div>
  )
}
