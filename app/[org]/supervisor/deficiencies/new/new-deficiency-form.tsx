"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useToast } from "@/hooks/use-toast"
import { createDeficiency } from "@/actions/deficiencies"
import { Plus, Trash2, AlertTriangle } from "lucide-react"

interface JanitorOption {
  id: string
  first_name: string
  last_name: string
}

interface DeficiencyEntry {
  id: string
  description: string
  severity: "low" | "medium" | "high"
  assignedTo: string | null
}

export function NewDeficiencyForm({
  taskId,
  activityId,
  roomName,
  janitors,
  orgSlug,
}: {
  taskId: string
  activityId: string
  roomName: string
  janitors: JanitorOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<DeficiencyEntry[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      severity: "medium",
      assignedTo: null,
    },
  ])

  function addEntry() {
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: "",
        severity: "medium",
        assignedTo: null,
      },
    ])
  }

  function removeEntry(id: string) {
    if (entries.length <= 1) return
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function updateEntry(
    id: string,
    field: keyof DeficiencyEntry,
    value: string | null
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    )
  }

  async function handleSubmit() {
    // Validate
    const valid = entries.every((e) => e.description.trim().length > 0)
    if (!valid) {
      toast({
        title: "Error",
        description: "All deficiencies must have a description",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const results = await Promise.all(
      entries.map((e) =>
        createDeficiency({
          roomTaskId: taskId,
          description: e.description.trim(),
          severity: e.severity,
          assignedTo: e.assignedTo,
        })
      )
    )

    const failed = results.filter((r) => !r.success)
    if (failed.length > 0) {
      toast({
        title: "Error",
        description: `${failed.length} deficiencies failed to create`,
        variant: "destructive",
      })
    } else {
      toast({
        title: `${entries.length} deficienc${entries.length === 1 ? "y" : "ies"} reported`,
      })
      if (activityId) {
        router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
      } else {
        router.push(`/${orgSlug}/supervisor/deficiencies`)
      }
      router.refresh()
    }
    setIsSubmitting(false)
  }

  function handleSkip() {
    if (activityId) {
      router.push(`/${orgSlug}/supervisor/activities/${activityId}`)
    } else {
      router.push(`/${orgSlug}/supervisor/deficiencies`)
    }
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, idx) => (
        <Card key={entry.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Issue #{idx + 1}
              </CardTitle>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-600"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                value={entry.description}
                onChange={(e) =>
                  updateEntry(entry.id, "description", e.target.value)
                }
                placeholder="Describe the issue..."
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Severity
                </label>
                <Select
                  value={entry.severity}
                  onValueChange={(v) =>
                    updateEntry(entry.id, "severity", v)
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Assign to
                </label>
                <Select
                  value={entry.assignedTo || "unassigned"}
                  onValueChange={(v) =>
                    updateEntry(
                      entry.id,
                      "assignedTo",
                      v === "unassigned" ? null : v
                    )
                  }
                >
                  <SelectTrigger className="mt-1 h-9">
                    <SelectValue />
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
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        className="w-full"
        onClick={addEntry}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Another Issue
      </Button>

      <div className="flex gap-3 pb-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleSkip}
          disabled={isSubmitting}
        >
          Skip
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {isSubmitting
            ? "Submitting..."
            : `Report ${entries.length} Issue${entries.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </div>
  )
}
