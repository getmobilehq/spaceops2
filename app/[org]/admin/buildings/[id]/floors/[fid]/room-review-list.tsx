"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CheckCircle2,
  Plus,
  SkipForward,
  Undo2,
  Pencil,
} from "lucide-react"
import type { ExtractedRoom } from "@/lib/validations/vectorisation"
import type { MatchResult } from "@/lib/vectorisation/match-rooms"

interface ExistingRoom {
  id: string
  name: string
  roomTypeName: string
}

interface RoomType {
  id: string
  name: string
}

export interface ReviewedRoomState {
  tempId: string
  room: ExtractedRoom
  action: "match" | "create" | "skip"
  matchedRoomId: string | null
  overrideName: string
  roomTypeId: string | null
}

interface RoomReviewListProps {
  rooms: ExtractedRoom[]
  matches: MatchResult[]
  existingRooms: ExistingRoom[]
  roomTypes: RoomType[]
  selectedRoomId: string | null
  reviewState: ReviewedRoomState[]
  onReviewChange: (updated: ReviewedRoomState[]) => void
  onSelectRoom: (tempId: string) => void
}

export function RoomReviewList({
  rooms,
  matches,
  existingRooms,
  roomTypes,
  selectedRoomId,
  reviewState,
  onReviewChange,
  onSelectRoom,
}: RoomReviewListProps) {
  const [editingName, setEditingName] = useState<string | null>(null)

  function updateRoom(tempId: string, updates: Partial<ReviewedRoomState>) {
    onReviewChange(
      reviewState.map((r) =>
        r.tempId === tempId ? { ...r, ...updates } : r
      )
    )
  }

  // Find the best matching room type for a detected type
  function findRoomType(detectedType: string): string | null {
    const lower = detectedType.toLowerCase()
    const match = roomTypes.find(
      (rt) => rt.name.toLowerCase() === lower
    )
    if (match) return match.id
    // Partial match
    const partial = roomTypes.find(
      (rt) =>
        rt.name.toLowerCase().includes(lower) ||
        lower.includes(rt.name.toLowerCase())
    )
    return partial?.id || null
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {reviewState.map((state) => {
        const room = rooms.find((r) => r.tempId === state.tempId)!
        const match = matches.find((m) => m.tempId === state.tempId)
        const isSelected = selectedRoomId === state.tempId
        const isSkipped = state.action === "skip"

        return (
          <div
            key={state.tempId}
            className={`rounded-md border p-3 space-y-2 cursor-pointer transition-colors ${
              isSelected
                ? "border-brand bg-brand/5"
                : isSkipped
                  ? "border-muted bg-muted/30 opacity-60"
                  : "border-border hover:border-brand/30"
            }`}
            onClick={() => onSelectRoom(state.tempId)}
          >
            {/* Header row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {state.action === "match" && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                )}
                {state.action === "create" && (
                  <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                )}
                {state.action === "skip" && (
                  <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                {editingName === state.tempId ? (
                  <Input
                    className="h-7 text-sm"
                    value={state.overrideName}
                    onChange={(e) =>
                      updateRoom(state.tempId, {
                        overrideName: e.target.value,
                      })
                    }
                    onBlur={() => setEditingName(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setEditingName(null)
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`text-sm font-medium truncate ${
                      isSkipped ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {state.overrideName || room.label}
                  </span>
                )}

                <Badge variant="outline" className="text-[10px] shrink-0">
                  {room.detectedType}
                </Badge>

                {room.confidence !== "high" && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${
                      room.confidence === "low"
                        ? "border-red-200 text-red-600"
                        : "border-yellow-200 text-yellow-600"
                    }`}
                  >
                    {room.confidence}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!isSkipped && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingName(state.tempId)
                    }}
                    title="Edit name"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Actions row */}
            {!isSkipped && (
              <div className="flex items-center gap-2">
                {state.action === "match" ? (
                  <Select
                    value={state.matchedRoomId || ""}
                    onValueChange={(v) => {
                      if (v === "__unmatch") {
                        updateRoom(state.tempId, {
                          action: "create",
                          matchedRoomId: null,
                          roomTypeId: findRoomType(room.detectedType),
                        })
                      } else {
                        updateRoom(state.tempId, { matchedRoomId: v })
                      }
                    }}
                  >
                    <SelectTrigger
                      className="h-7 text-xs flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="Select room..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__unmatch">Unmatch</SelectItem>
                      {existingRooms.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name} ({r.roomTypeName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <>
                    <Select
                      value={state.roomTypeId || "none"}
                      onValueChange={(v) =>
                        updateRoom(state.tempId, {
                          roomTypeId: v === "none" ? null : v,
                        })
                      }
                    >
                      <SelectTrigger
                        className="h-7 text-xs flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <SelectValue placeholder="Room type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No type</SelectItem>
                        {roomTypes.map((rt) => (
                          <SelectItem key={rt.id} value={rt.id}>
                            {rt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Allow switching to match if there was a match suggestion */}
                    {match && match.matchScore > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateRoom(state.tempId, {
                            action: "match",
                            matchedRoomId: match.matchedRoomId,
                          })
                        }}
                      >
                        Match
                      </Button>
                    )}
                  </>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    updateRoom(state.tempId, { action: "skip" })
                  }}
                >
                  Skip
                </Button>
              </div>
            )}

            {/* Undo skip */}
            {isSkipped && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  const prevAction = match?.matchedRoomId ? "match" : "create"
                  updateRoom(state.tempId, {
                    action: prevAction,
                    matchedRoomId: match?.matchedRoomId || null,
                    roomTypeId: findRoomType(room.detectedType),
                  })
                }}
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo Skip
              </Button>
            )}

            {/* Match info */}
            {match && match.matchScore > 0 && state.action !== "skip" && (
              <p className="text-[10px] text-muted-foreground">
                {match.matchReason} (score: {match.matchScore.toFixed(1)})
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
