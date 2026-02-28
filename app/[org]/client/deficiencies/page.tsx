import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getClientDeficiencies } from "@/lib/queries/client-dashboard"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"

export const metadata = {
  title: "Deficiencies - SpaceOps",
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof AlertTriangle }> = {
  open: { label: "Open", className: "border-red-200 bg-red-50 text-red-700", icon: AlertTriangle },
  in_progress: { label: "In Progress", className: "border-yellow-200 bg-yellow-50 text-yellow-700", icon: Clock },
  resolved: { label: "Resolved", className: "border-green-200 bg-green-50 text-green-700", icon: CheckCircle2 },
}

const severityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "border-blue-200 bg-blue-50 text-blue-700" },
  medium: { label: "Medium", className: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  high: { label: "High", className: "border-red-200 bg-red-50 text-red-700" },
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
        <h1 className="text-2xl font-bold text-brand">Deficiencies</h1>
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
            const sc = statusConfig[d.status] || statusConfig.open
            const sev = severityConfig[d.severity] || severityConfig.medium
            const StatusIcon = sc.icon
            const roomName = (d.room_tasks as any)?.rooms?.name || "Unknown Room"
            const buildingName = (d.room_tasks as any)?.cleaning_activities?.floors?.buildings?.name || ""

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
                        {roomName}{buildingName ? ` · ${buildingName}` : ""} · {new Date(d.created_at).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={sev.className}>
                        {sev.label}
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
            const sc = statusConfig[d.status] || statusConfig.resolved
            const sev = severityConfig[d.severity] || severityConfig.medium
            const StatusIcon = sc.icon
            const roomName = (d.room_tasks as any)?.rooms?.name || "Unknown Room"

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
            <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">
              No deficiencies found. Everything looks good!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
