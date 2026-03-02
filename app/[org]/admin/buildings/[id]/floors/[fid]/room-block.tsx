"use client"

import { cn } from "@/lib/utils"
import type { ExtractedRoom } from "@/lib/validations/vectorisation"

interface TypeStyle {
  bg: string
  border: string
  text: string
  pattern?: string
}

const typeStyles: Record<string, TypeStyle> = {
  Office: {
    bg: "#DBEAFE",
    border: "#3B82F6",
    text: "#1E40AF",
  },
  Bathroom: {
    bg: "#EDE9FE",
    border: "#8B5CF6",
    text: "#5B21B6",
    pattern:
      "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(139,92,246,0.15) 4px, rgba(139,92,246,0.15) 8px)",
  },
  Kitchen: {
    bg: "#FFF7ED",
    border: "#F97316",
    text: "#9A3412",
    pattern:
      "radial-gradient(circle, rgba(249,115,22,0.2) 1.5px, transparent 1.5px)",
  },
  "Meeting Room": {
    bg: "#DCFCE7",
    border: "#22C55E",
    text: "#166534",
    pattern:
      "repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(34,197,94,0.12) 6px, rgba(34,197,94,0.12) 7px), repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(34,197,94,0.12) 6px, rgba(34,197,94,0.12) 7px)",
  },
  Lobby: {
    bg: "#FEF9C3",
    border: "#EAB308",
    text: "#854D0E",
    pattern:
      "repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(234,179,8,0.15) 5px, rgba(234,179,8,0.15) 6px)",
  },
  Stairwell: {
    bg: "#F3F4F6",
    border: "#6B7280",
    text: "#374151",
    pattern:
      "repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(107,114,128,0.15) 5px, rgba(107,114,128,0.15) 6px)",
  },
  Storage: {
    bg: "#F5F5F4",
    border: "#78716C",
    text: "#44403C",
    pattern:
      "repeating-conic-gradient(rgba(120,113,108,0.1) 0% 25%, transparent 0% 50%) 0 0 / 10px 10px",
  },
  Corridor: {
    bg: "#F8FAFC",
    border: "#94A3B8",
    text: "#475569",
  },
  Reception: {
    bg: "#FFFBEB",
    border: "#F59E0B",
    text: "#92400E",
    pattern:
      "repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(245,158,11,0.12) 6px, rgba(245,158,11,0.12) 12px)",
  },
  "Server Room": {
    bg: "#ECFEFF",
    border: "#06B6D4",
    text: "#155E75",
    pattern:
      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(6,182,212,0.1) 3px, rgba(6,182,212,0.1) 4px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(6,182,212,0.1) 8px, rgba(6,182,212,0.1) 9px)",
  },
  Utility: {
    bg: "#F4F4F5",
    border: "#71717A",
    text: "#3F3F46",
    pattern:
      "radial-gradient(circle, rgba(113,113,122,0.18) 1px, transparent 1px)",
  },
  "Open Plan": {
    bg: "#D1FAE5",
    border: "#10B981",
    text: "#065F46",
  },
  "Break Room": {
    bg: "#FFE4E6",
    border: "#F43F5E",
    text: "#9F1239",
    pattern:
      "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(244,63,94,0.12) 4px, rgba(244,63,94,0.12) 8px)",
  },
  Other: {
    bg: "#F5F5F5",
    border: "#A3A3A3",
    text: "#525252",
  },
}

export function getTypeStyle(type: string): TypeStyle {
  return typeStyles[type] || typeStyles.Other
}

/** All type keys for rendering a legend */
export const allRoomTypes = Object.keys(typeStyles)

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
  const style = getTypeStyle(room.detectedType)

  const bgStyle: React.CSSProperties = {
    backgroundColor: style.bg,
    borderColor: style.border,
    ...(style.pattern
      ? {
          backgroundImage: style.pattern,
          backgroundSize:
            style.pattern.includes("radial") ? "12px 12px" : undefined,
        }
      : {}),
  }

  const confidenceColor =
    room.confidence === "high"
      ? "#22C55E"
      : room.confidence === "medium"
        ? "#EAB308"
        : "#EF4444"

  return (
    <div
      className={cn(
        "border-2 rounded-lg cursor-pointer transition-all p-3 min-h-[80px] min-w-[120px] flex flex-col justify-between",
        isSelected && "ring-2 ring-brand ring-offset-2 z-10 shadow-md",
        room.confidence === "low" && "border-dashed"
      )}
      style={bgStyle}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={`${room.label} (${room.detectedType}) - ${room.confidence} confidence`}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className="text-xs font-bold leading-tight line-clamp-2"
          style={{ color: style.text }}
        >
          {room.label}
        </span>
        <span
          className="shrink-0 mt-0.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: confidenceColor }}
          title={`${room.confidence} confidence`}
        />
      </div>

      <div className="flex items-center justify-between gap-1 mt-2">
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
          style={{
            backgroundColor: `${style.border}20`,
            color: style.text,
          }}
        >
          {room.detectedType}
        </span>

        {isMatched && (
          <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-sm">
            Matched
          </span>
        )}
      </div>
    </div>
  )
}
