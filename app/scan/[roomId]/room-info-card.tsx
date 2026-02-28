"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Layers, DoorOpen, AlertTriangle, CheckCircle2 } from "lucide-react"
import { reportIssue } from "@/actions/deficiencies"

interface RoomInfo {
  id: string
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
  const [showForm, setShowForm] = useState(false)
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("medium")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    setError("")
    const result = await reportIssue({
      roomId: room.id,
      description,
      severity: severity as "low" | "medium" | "high",
    })
    setSubmitting(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setSuccess(true)
      setShowForm(false)
    }
  }

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

        {role === "client" && (
          <div className="rounded-md border border-muted p-3">
            <p className="text-sm text-muted-foreground">
              You are viewing this room as a client.
            </p>
          </div>
        )}

        {success ? (
          <div className="rounded-md border border-green-200 bg-green-50 p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800">
              Issue reported successfully.
            </p>
          </div>
        ) : showForm ? (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              Report an Issue
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!description.trim() || submitting}
                className="flex-1"
                size="sm"
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
