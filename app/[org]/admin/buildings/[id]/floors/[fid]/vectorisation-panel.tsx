"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Loader2, AlertCircle, Check, Merge, Scissors } from "lucide-react"
import { SpatialBlockMap } from "./spatial-block-map"
import { RoomReviewList, type ReviewedRoomState } from "./room-review-list"
import { vectoriseFloorPlan, applyVectorisation } from "@/actions/vectorisation"
import {
  matchExtractedRooms,
  type MatchResult,
} from "@/lib/vectorisation/match-rooms"
import type { ExtractedRoom, ExtractionResult } from "@/lib/validations/vectorisation"

interface ExistingRoom {
  id: string
  name: string
  roomTypeName: string
}

interface RoomType {
  id: string
  name: string
}

interface VectorisationPanelProps {
  floorId: string
  floorPlanUrl: string | null
  extractionStatus: string
  extractionError: string | null
  extractedData: ExtractionResult | null
  existingRooms: ExistingRoom[]
  roomTypes: RoomType[]
  isConfirmed?: boolean
}

export function VectorisationPanel({
  floorId,
  floorPlanUrl,
  extractionStatus: initialStatus,
  extractionError: initialError,
  extractedData: initialData,
  existingRooms,
  roomTypes,
  isConfirmed = false,
}: VectorisationPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isExtracting, setIsExtracting] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [extractionStatus, setExtractionStatus] = useState(initialStatus)
  const [extractionError, setExtractionError] = useState(initialError)
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(initialData)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set())

  // Compute matches
  const matches: MatchResult[] = useMemo(() => {
    if (!extractedData) return []
    return matchExtractedRooms(
      extractedData.rooms.map((r) => ({
        tempId: r.tempId,
        label: r.label,
        detectedType: r.detectedType,
      })),
      existingRooms
    )
  }, [extractedData, existingRooms])

  // Build initial review state from matches
  const [reviewState, setReviewState] = useState<ReviewedRoomState[]>(() =>
    buildReviewState(extractedData?.rooms || [], matches, roomTypes)
  )

  // Active (non-skipped) rooms for the spatial map
  const activeRooms = useMemo(() => {
    const skipIds = new Set(
      reviewState.filter((r) => r.action === "skip").map((r) => r.tempId)
    )
    return (extractedData?.rooms || []).filter((r) => !skipIds.has(r.tempId))
  }, [extractedData, reviewState])

  const matchedRoomIds = useMemo(
    () =>
      new Set(
        reviewState
          .filter((r) => r.action === "match")
          .map((r) => r.tempId)
      ),
    [reviewState]
  )

  // Handle extraction
  async function handleVectorise() {
    setIsExtracting(true)
    setExtractionError(null)
    setExtractionStatus("processing")

    const result = await vectoriseFloorPlan({ floorId })

    if (result.success) {
      setExtractedData(result.data)
      setExtractionStatus("completed")

      const newMatches = matchExtractedRooms(
        result.data.rooms.map((r) => ({
          tempId: r.tempId,
          label: r.label,
          detectedType: r.detectedType,
        })),
        existingRooms
      )
      setReviewState(buildReviewState(result.data.rooms, newMatches, roomTypes))

      toast({
        title: `${result.data.totalDetected} rooms detected`,
        description: result.data.layoutSummary.slice(0, 80),
      })
    } else {
      setExtractionStatus("failed")
      setExtractionError(result.error)
      toast({
        title: "Extraction failed",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsExtracting(false)
  }

  // Handle apply
  async function handleApply() {
    const toApply = reviewState.filter((r) => r.action !== "skip")
    if (toApply.length === 0) {
      toast({
        title: "Nothing to apply",
        description: "All rooms are skipped.",
        variant: "destructive",
      })
      return
    }

    setIsApplying(true)

    const result = await applyVectorisation({
      floorId,
      rooms: reviewState.map((r) => ({
        ...r.room,
        action: r.action,
        matchedRoomId: r.matchedRoomId || undefined,
        overrideName: r.overrideName || undefined,
        roomTypeId: r.roomTypeId || undefined,
      })),
    })

    if (result.success) {
      toast({
        title: "Vectorisation applied",
        description: `${toApply.length} room${toApply.length === 1 ? "" : "s"} processed.`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsApplying(false)
  }

  // Merge selected rooms
  const handleMerge = useCallback(() => {
    if (selectedForMerge.size < 2) return

    const toMerge = reviewState.filter((r) => selectedForMerge.has(r.tempId))
    const rooms = toMerge.map((r) => r.room)

    // Calculate bounding rectangle
    const minX = Math.min(...rooms.map((r) => r.x - r.width / 2))
    const maxX = Math.max(...rooms.map((r) => r.x + r.width / 2))
    const minY = Math.min(...rooms.map((r) => r.y - r.height / 2))
    const maxY = Math.max(...rooms.map((r) => r.y + r.height / 2))

    const mergedRoom: ExtractedRoom = {
      tempId: `merged-${Date.now()}`,
      label: toMerge[0].room.label + " (merged)",
      detectedType: toMerge[0].room.detectedType,
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width: maxX - minX,
      height: maxY - minY,
      confidence: "medium",
    }

    // Remove merged rooms, add new one
    const newExtracted = [
      ...((extractedData?.rooms || []).filter(
        (r) => !selectedForMerge.has(r.tempId)
      )),
      mergedRoom,
    ]

    setExtractedData(
      extractedData
        ? { ...extractedData, rooms: newExtracted, totalDetected: newExtracted.length }
        : null
    )

    const newReview = [
      ...reviewState.filter((r) => !selectedForMerge.has(r.tempId)),
      {
        tempId: mergedRoom.tempId,
        room: mergedRoom,
        action: "create" as const,
        matchedRoomId: null,
        overrideName: mergedRoom.label,
        roomTypeId: findRoomType(mergedRoom.detectedType, roomTypes),
      },
    ]
    setReviewState(newReview)
    setSelectedForMerge(new Set())
    setSelectedRoomId(mergedRoom.tempId)
  }, [selectedForMerge, reviewState, extractedData, roomTypes])

  // Split selected room
  const handleSplit = useCallback(() => {
    if (!selectedRoomId) return
    const state = reviewState.find((r) => r.tempId === selectedRoomId)
    if (!state) return

    const room = state.room
    const half = room.width / 2

    const left: ExtractedRoom = {
      tempId: `split-l-${Date.now()}`,
      label: room.label + " A",
      detectedType: room.detectedType,
      x: room.x - half / 2,
      y: room.y,
      width: half,
      height: room.height,
      confidence: "medium",
    }
    const right: ExtractedRoom = {
      tempId: `split-r-${Date.now()}`,
      label: room.label + " B",
      detectedType: room.detectedType,
      x: room.x + half / 2,
      y: room.y,
      width: half,
      height: room.height,
      confidence: "medium",
    }

    const newExtracted = [
      ...((extractedData?.rooms || []).filter(
        (r) => r.tempId !== selectedRoomId
      )),
      left,
      right,
    ]

    setExtractedData(
      extractedData
        ? { ...extractedData, rooms: newExtracted, totalDetected: newExtracted.length }
        : null
    )

    const typeId = findRoomType(room.detectedType, roomTypes)
    const newReview = [
      ...reviewState.filter((r) => r.tempId !== selectedRoomId),
      {
        tempId: left.tempId,
        room: left,
        action: "create" as const,
        matchedRoomId: null,
        overrideName: left.label,
        roomTypeId: typeId,
      },
      {
        tempId: right.tempId,
        room: right,
        action: "create" as const,
        matchedRoomId: null,
        overrideName: right.label,
        roomTypeId: typeId,
      },
    ]
    setReviewState(newReview)
    setSelectedRoomId(left.tempId)
  }, [selectedRoomId, reviewState, extractedData, roomTypes])

  function handleSelectRoom(tempId: string) {
    setSelectedRoomId(tempId)
    // Toggle merge selection with shift
    // For simplicity, use a toggle button instead
  }

  function toggleMergeSelect(tempId: string) {
    setSelectedForMerge((prev) => {
      const next = new Set(prev)
      if (next.has(tempId)) next.delete(tempId)
      else next.add(tempId)
      return next
    })
  }

  if (!floorPlanUrl) return null

  // Confirmed — show read-only block map
  if (isConfirmed && extractedData && extractedData.rooms.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Floor Plan Layout</CardTitle>
          <CardDescription>
            {extractedData.totalDetected} rooms detected &middot; Confirmed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpatialBlockMap
            floorPlanUrl={floorPlanUrl}
            rooms={extractedData.rooms}
            selectedRoomId={null}
            matchedRoomIds={new Set()}
            onSelectRoom={() => {}}
          />
        </CardContent>
      </Card>
    )
  }

  // Not yet extracted — show trigger button
  if (
    extractionStatus === "pending" ||
    extractionStatus === "failed" ||
    (extractionStatus === "completed" && !extractedData)
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Room Detection</CardTitle>
          <CardDescription>
            Analyze the floor plan with AI to automatically detect rooms and spaces.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {extractionError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{extractionError}</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pl-6">
                <p className="font-medium text-foreground">You can try:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Re-uploading a cleaner, higher-contrast image</li>
                  <li>Cropping the image to just the floor layout (remove legends and margins)</li>
                  <li>Using a scanned PDF or digital export instead of a photo</li>
                  <li>Adding rooms manually using the room management section below</li>
                </ul>
              </div>
            </div>
          )}

          <Button onClick={handleVectorise} disabled={isExtracting}>
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing floor plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {extractionStatus === "failed"
                  ? "Retry Analysis"
                  : "Analyse Floor Plan"}
              </>
            )}
          </Button>

          {isExtracting && (
            <p className="text-xs text-muted-foreground">
              This may take 15-30 seconds. AI is detecting rooms, corridors, and spaces.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  // Processing state
  if (extractionStatus === "processing" && !extractedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Room Detection</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 py-8 justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing floor plan with AI... This may take 15-30 seconds.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Extracted — show review UI
  if (!extractedData || extractedData.rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Room Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No rooms were detected in this floor plan. Try re-uploading a clearer image.
          </p>
          <Button variant="outline" onClick={handleVectorise} disabled={isExtracting}>
            <Sparkles className="mr-2 h-4 w-4" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const createCount = reviewState.filter((r) => r.action === "create").length
  const matchCount = reviewState.filter((r) => r.action === "match").length
  const skipCount = reviewState.filter((r) => r.action === "skip").length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">AI Room Detection</CardTitle>
            <CardDescription>
              {extractedData.totalDetected} rooms detected &middot;{" "}
              {matchCount} matched &middot; {createCount} new &middot;{" "}
              {skipCount} skipped
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVectorise}
            disabled={isExtracting}
          >
            <Sparkles className="mr-2 h-3 w-3" />
            Re-analyse
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spatial map */}
        <SpatialBlockMap
          floorPlanUrl={floorPlanUrl}
          rooms={activeRooms}
          selectedRoomId={selectedRoomId}
          matchedRoomIds={matchedRoomIds}
          onSelectRoom={handleSelectRoom}
        />

        {/* Merge/Split toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedForMerge.size < 2}
            onClick={handleMerge}
          >
            <Merge className="mr-1 h-3 w-3" />
            Merge ({selectedForMerge.size})
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedRoomId}
            onClick={handleSplit}
          >
            <Scissors className="mr-1 h-3 w-3" />
            Split
          </Button>
          {selectedRoomId && (
            <Button
              variant={selectedForMerge.has(selectedRoomId) ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleMergeSelect(selectedRoomId)}
            >
              {selectedForMerge.has(selectedRoomId)
                ? "Deselect for merge"
                : "Select for merge"}
            </Button>
          )}
        </div>

        {/* Review list */}
        <RoomReviewList
          rooms={extractedData.rooms}
          matches={matches}
          existingRooms={existingRooms}
          roomTypes={roomTypes}
          selectedRoomId={selectedRoomId}
          reviewState={reviewState}
          onReviewChange={setReviewState}
          onSelectRoom={handleSelectRoom}
        />

        {/* Apply button */}
        <Button
          className="w-full"
          onClick={handleApply}
          disabled={isApplying}
        >
          {isApplying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Confirm &amp; Apply ({matchCount + createCount} rooms)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// Helpers

function findRoomType(detectedType: string, roomTypes: { id: string; name: string }[]): string | null {
  const lower = detectedType.toLowerCase()
  const exact = roomTypes.find((rt) => rt.name.toLowerCase() === lower)
  if (exact) return exact.id
  const partial = roomTypes.find(
    (rt) =>
      rt.name.toLowerCase().includes(lower) ||
      lower.includes(rt.name.toLowerCase())
  )
  return partial?.id || null
}

function buildReviewState(
  rooms: ExtractedRoom[],
  matches: MatchResult[],
  roomTypes: { id: string; name: string }[]
): ReviewedRoomState[] {
  return rooms.map((room) => {
    const match = matches.find((m) => m.tempId === room.tempId)
    const isMatched = match && match.matchedRoomId && match.matchScore >= 0.5

    return {
      tempId: room.tempId,
      room,
      action: isMatched ? ("match" as const) : ("create" as const),
      matchedRoomId: isMatched ? match.matchedRoomId : null,
      overrideName: room.label,
      roomTypeId: isMatched ? null : findRoomType(room.detectedType, roomTypes),
    }
  })
}
