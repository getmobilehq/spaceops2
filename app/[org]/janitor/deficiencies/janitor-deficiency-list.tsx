"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { resolveDeficiency } from "@/actions/deficiencies"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

interface Deficiency {
  id: string
  description: string
  severity: string
  status: string
  created_at: string
  room_tasks: {
    id: string
    rooms: { name: string; room_types: { name: string } | null } | null
    cleaning_activities: { name: string; scheduled_date: string } | null
  } | null
}

const severityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "border-blue-200 bg-blue-50 text-blue-700" },
  medium: { label: "Medium", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  high: { label: "High", className: "border-red-200 bg-red-50 text-red-700" },
}

export function JanitorDeficiencyList({
  deficiencies,
  orgSlug,
}: {
  deficiencies: Deficiency[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [resolveDialog, setResolveDialog] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleResolve() {
    if (!resolveDialog) return
    setIsSubmitting(true)

    const result = await resolveDeficiency({
      deficiencyId: resolveDialog,
      resolutionNote: resolutionNote || undefined,
    })

    if (result.success) {
      toast({ title: "Deficiency resolved" })
      setResolveDialog(null)
      setResolutionNote("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSubmitting(false)
  }

  if (deficiencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
          <p className="text-sm text-muted-foreground">
            No open deficiencies. Great work!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {deficiencies.map((d) => {
          const sev = severityConfig[d.severity] || severityConfig.medium

          return (
            <Card key={d.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                      <p className="text-sm font-medium">
                        {d.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {d.room_tasks?.rooms?.name || "Unknown Room"}
                      </span>
                      <span>·</span>
                      <span>
                        {d.room_tasks?.cleaning_activities?.name || "Unknown"}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={sev.className}>
                    {sev.label}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setResolveDialog(d.id)
                    setResolutionNote("")
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Resolved
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Resolve dialog */}
      <Dialog
        open={!!resolveDialog}
        onOpenChange={(open) => {
          if (!open) setResolveDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Deficiency</DialogTitle>
            <DialogDescription>
              Add an optional note about how you resolved this issue.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="What did you do to fix this..."
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialog(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
