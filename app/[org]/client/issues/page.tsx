import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getClientDeficiencies } from "@/lib/queries/client-dashboard"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { ISSUE_STATUS, ISSUE_SEVERITY } from "@/lib/status-styles"

export const metadata = {
  title: "Issues - SpaceOps",
}


export default async function ClientDeficienciesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()
  const role = user.app_metadata?.role as string | undefined
  if (role !== "client") return notFound()

  const deficiencies = await getClientDeficiencies(supabase)

  const open = deficiencies.filter((d) => d.status !== "resolved")
  const resolved = deficiencies.filter((d) => d.status === "resolved")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Issues</h1>
        <p className="text-muted-foreground">
          Issues found during inspections
        </p>
      </div>

      {open.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Open ({open.length})
          </h2>
          {open.map((d) => {
            const sc = ISSUE_STATUS[d.status] || ISSUE_STATUS.open
            const StatusIcon = sc.icon!
            const sevConfig = ISSUE_SEVERITY[d.severity] || ISSUE_SEVERITY.medium
            const roomTasks = d.room_tasks as Record<string, unknown> | null
            const roomName = (roomTasks?.rooms as Record<string, unknown>)?.name as string || "Unknown Room"
            const buildingName = ((roomTasks?.cleaning_activities as Record<string, unknown>)?.floors as Record<string, unknown>)?.buildings as Record<string, unknown> | undefined
            const buildingNameStr = (buildingName?.name as string) || ""

            return (
              <Card key={d.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium truncate">
                          {d.description}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {roomName}{buildingNameStr ? ` · ${buildingNameStr}` : ""} · {new Date(d.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={sevConfig.className}>
                        {sevConfig.label}
                      </Badge>
                      <Badge variant="outline" className={sc.className}>
                        {sc.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Resolved ({resolved.length})
          </h2>
          {resolved.map((d) => {
            const sc = ISSUE_STATUS[d.status] || ISSUE_STATUS.resolved
            const StatusIcon = sc.icon!
            const roomTasks = d.room_tasks as Record<string, unknown> | null
            const roomName = (roomTasks?.rooms as Record<string, unknown>)?.name as string || "Unknown Room"

            return (
              <Card key={d.id} className="opacity-70">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium truncate">
                          {d.description}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {roomName} · {new Date(d.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <Badge variant="outline" className={sc.className}>
                      {sc.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {deficiencies.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
            <p className="text-sm text-muted-foreground">
              No issues found. Everything looks good!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
