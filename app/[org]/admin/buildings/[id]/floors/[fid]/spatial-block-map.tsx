"use client"

import { useMemo, useState } from "react"
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Maximize2, Image as ImageIcon } from "lucide-react"
import { RoomBlock, getTypeStyle, allRoomTypes } from "./room-block"
import type { ExtractedRoom } from "@/lib/validations/vectorisation"

interface SpatialBlockMapProps {
  floorPlanUrl: string
  rooms: ExtractedRoom[]
  selectedRoomId: string | null
  matchedRoomIds: Set<string>
  onSelectRoom: (tempId: string) => void
}

/** Cluster rooms into rows by Y-position proximity, then sort each row by X */
function buildGrid(rooms: ExtractedRoom[]): ExtractedRoom[][] {
  if (rooms.length === 0) return []

  // Sort by Y first
  const sorted = [...rooms].sort((a, b) => a.y - b.y)

  const rows: ExtractedRoom[][] = []
  let currentRow: ExtractedRoom[] = [sorted[0]]
  let rowY = sorted[0].y

  for (let i = 1; i < sorted.length; i++) {
    const room = sorted[i]
    // If within 10% Y of the row anchor, same row
    if (Math.abs(room.y - rowY) <= 10) {
      currentRow.push(room)
    } else {
      // Finalize row, start new one
      rows.push(currentRow.sort((a, b) => a.x - b.x))
      currentRow = [room]
      rowY = room.y
    }
  }
  // Push last row
  rows.push(currentRow.sort((a, b) => a.x - b.x))

  return rows
}

export function SpatialBlockMap({
  floorPlanUrl,
  rooms,
  selectedRoomId,
  matchedRoomIds,
  onSelectRoom,
}: SpatialBlockMapProps) {
  const [showImage, setShowImage] = useState(false)

  const grid = useMemo(() => buildGrid(rooms), [rooms])

  // Collect unique room types present for the legend
  const presentTypes = useMemo(() => {
    const types = new Set(rooms.map((r) => r.detectedType))
    return allRoomTypes.filter((t) => types.has(t))
  }, [rooms])

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {presentTypes.map((type) => {
          const style = getTypeStyle(type)
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm border"
                style={{
                  backgroundColor: style.bg,
                  borderColor: style.border,
                  backgroundImage: style.pattern || "none",
                  backgroundSize: style.pattern?.includes("radial")
                    ? "6px 6px"
                    : undefined,
                }}
              />
              <span className="text-[10px] text-muted-foreground">
                {type}
              </span>
            </div>
          )
        })}
      </div>

      {/* Zoomable canvas */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        wheel={{ step: 0.1 }}
        doubleClick={{ mode: "reset" }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Controls bar */}
            <div className="flex items-center gap-1 mb-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => zoomIn()}
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => zoomOut()}
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => resetTransform()}
                title="Reset zoom"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <div className="h-4 w-px bg-border mx-1" />
              <Button
                variant={showImage ? "secondary" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={() => setShowImage(!showImage)}
              >
                <ImageIcon className="h-3 w-3" />
                {showImage ? "Hide plan" : "Show plan"}
              </Button>
              <span className="text-[10px] text-muted-foreground ml-auto">
                Scroll to zoom &middot; Drag to pan
              </span>
            </div>

            {/* Canvas area */}
            <div className="border rounded-lg overflow-hidden bg-white">
              <TransformComponent
                wrapperStyle={{ width: "100%", minHeight: "400px", maxHeight: "600px" }}
                contentStyle={{ width: "100%", minWidth: "600px" }}
              >
                <div className="relative p-6">
                  {/* Optional floor plan image */}
                  {showImage && (
                    <div className="absolute inset-0 opacity-15 pointer-events-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={floorPlanUrl}
                        alt="Floor plan reference"
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Grid layout */}
                  <div className="relative space-y-3">
                    {grid.map((row, rowIdx) => (
                      <div
                        key={rowIdx}
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: `repeat(${row.length}, minmax(120px, 1fr))`,
                        }}
                      >
                        {row.map((room) => (
                          <RoomBlock
                            key={room.tempId}
                            room={room}
                            isSelected={selectedRoomId === room.tempId}
                            isMatched={matchedRoomIds.has(room.tempId)}
                            onClick={() => onSelectRoom(room.tempId)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </TransformComponent>
            </div>
          </>
        )}
      </TransformWrapper>
    </div>
  )
}
