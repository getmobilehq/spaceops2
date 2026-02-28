"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  CalendarDays,
  MapPin,
} from "lucide-react"
import { updateDeficiency } from "@/actions/deficiencies"

interface Deficiency {
  id: string
  description: string
  severity: string
  status: string
  created_at: string
  resolution_note: string | null
  resolved_at: string | null
  room_tasks: {
    id: string
    rooms: { name: string; room_types: { name: string } | null } | null
    cleaning_activities: {
      id: string
      name: string
      scheduled_date: string
    } | null
  } | null
  reporter: { id: string; first_name: string; last_name: string } | null
  assignee: { id: string; first_name: string; last_name: string } | null
  resolver: { first_name: string; last_name: string } | null
}

interface Janitor {
  id: string
  first_name: string
  last_name: string
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  open: {
    label: "Open",
    className: "border-red-200 bg-red-50 text-red-700",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "In Progress",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    className: "border-green-200 bg-green-50 text-green-700",
    icon: CheckCircle2,
  },
}

const severityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Low",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  medium: {
    label: "Medium",
    className: "border-yellow-200 bg-yellow-50 text-yellow-700",
  },
  high: {
    label: "High",
    className: "border-red-200 bg-red-50 text-red-700",
  },
}

export function DeficiencyDetail({
  deficiency,
  janitors,
  orgSlug,
}: {
  deficiency: Deficiency
  janitors: Janitor[]
  orgSlug: string
}) {
  const router = useRouter()
  const [status, setStatus] = useState(deficiency.status)
  const [assignedTo, setAssignedTo] = useState(deficiency.assignee?.id || "")
  const [severity, setSeverity] = useState(deficiency.severity)
  const [note, setNote] = useState(deficiency.resolution_note || "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const isResolved = deficiency.status === "resolved"
  const sc = statusConfig[deficiency.status] || statusConfig.open
  const sev = severityConfig[deficiency.severity] || severityConfig.medium
  const StatusIcon = sc.icon

  const hasChanges =
    status !== deficiency.status ||
    assignedTo !== (deficiency.assignee?.id || "") ||
    severity !== deficiency.severity ||
    note !== (deficiency.resolution_note || "")

  async function handleSave() {
    setSaving(true)
    setError("")

    const result = await updateDeficiency({
      deficiencyId: deficiency.id,
      status: status !== deficiency.status ? (status as "open" | "in_progress" | "resolved") : undefined,
      assignedTo:
        assignedTo !== (deficiency.assignee?.id || "")
          ? assignedTo || null
          : undefined,
      severity:
        severity !== deficiency.severity
          ? (severity as "low" | "medium" | "high")
          : undefined,
      note: note !== (deficiency.resolution_note || "") ? note : undefined,
    })

    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className="h-5 w-5 shrink-0" />
            <Badge variant="outline" className={sc.className}>
              {sc.label}
            </Badge>
            <Badge variant="outline" className={sev.className}>
              {sev.label}
            </Badge>
          </div>
          <h1 className="text-xl font-bold text-brand">
            {deficiency.description}
          </h1>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {deficiency.room_tasks?.rooms?.name || "Unknown Room"}
              {deficiency.room_tasks?.rooms?.room_types?.name &&
                ` (${deficiency.room_tasks.rooms.room_types.name})`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>
              {deficiency.room_tasks?.cleaning_activities?.name || "N/A"} &middot;{" "}
              {deficiency.room_tasks?.cleaning_activities?.scheduled_date
                ? new Date(
                    deficiency.room_tasks.cleaning_activities.scheduled_date
                  ).toLocaleDateString("en-GB")
                : "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>
              Reported by{" "}
              {deficiency.reporter
                ? `${deficiency.reporter.first_name} ${deficiency.reporter.last_name}`
                : "Unknown"}{" "}
              on {new Date(deficiency.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
          {deficiency.assignee && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                Assigned to {deficiency.assignee.first_name}{" "}
                {deficiency.assignee.last_name}
              </span>
            </div>
          )}
          {deficiency.resolver && deficiency.resolved_at && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                Resolved by {deficiency.resolver.first_name}{" "}
                {deficiency.resolver.last_name} on{" "}
                {new Date(deficiency.resolved_at).toLocaleDateString("en-GB")}
              </span>
            </div>
          )}
          {deficiency.resolution_note && isResolved && (
            <div className="mt-2 rounded-md border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Resolution Note
              </p>
              <p className="text-sm">{deficiency.resolution_note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Management card */}
      {!isResolved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {janitors.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.first_name} {j.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
