"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Building2, Layers, DoorOpen } from "lucide-react"

interface RoomInfo {
  name: string
  typeName: string
  floorName: string
  buildingName: string
  isActive: boolean
}

export function RoomInfoCard({
  room,
  role,
}: {
  room: RoomInfo
  role: string
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-brand">{room.name}</CardTitle>
        <div className="flex items-center justify-center gap-2 pt-1">
          <Badge variant="secondary">{room.typeName}</Badge>
          {!room.isActive && (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{room.buildingName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>{room.floorName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DoorOpen className="h-4 w-4 text-muted-foreground" />
            <span>{room.typeName}</span>
          </div>
        </div>

        {role === "janitor" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              No active cleaning task for this room today. Check your Today page
              for assigned tasks.
            </p>
          </div>
        )}

        {role === "supervisor" && (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              Inspection tools will be available in a future update.
            </p>
          </div>
        )}

        {role === "client" && (
          <div className="rounded-md border border-muted p-3">
            <p className="text-sm text-muted-foreground">
              You are viewing this room as a client.
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" disabled>
          Report Issue (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  )
}
