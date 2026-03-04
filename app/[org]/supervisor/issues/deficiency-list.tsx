"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh"
import { ISSUE_STATUS, ISSUE_SEVERITY } from "@/lib/status-styles"

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
  reporter: { first_name: string; last_name: string } | null
  assignee: { first_name: string; last_name: string } | null
}


const FILTERS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
]

export function DeficiencyList({
  deficiencies,
  orgSlug,
  currentFilter,
}: {
  deficiencies: Deficiency[]
  orgSlug: string
  currentFilter: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  useRealtimeRefresh("deficiencies")

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={currentFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() =>
              router.push(
                f.value === "all"
                  ? pathname
                  : `${pathname}?status=${f.value}`
              )
            }
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Issue cards */}
      {deficiencies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No issues found.
            </p>
          </CardContent>
        </Card>
      ) : (
        deficiencies.map((d) => {
          const sc = ISSUE_STATUS[d.status] || ISSUE_STATUS.open
          const sev = ISSUE_SEVERITY[d.severity] || ISSUE_SEVERITY.medium
          const StatusIcon = sc.icon!

          return (
            <Link
              key={d.id}
              href={`/${orgSlug}/supervisor/issues/${d.id}`}
            >
              <Card className="hover:border-brand/40 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4 shrink-0" />
                        <p className="text-sm font-medium truncate">
                          {d.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {d.room_tasks?.rooms?.name || "Unknown Room"}
                        </span>
                        <span>·</span>
                        <span>
                          {d.room_tasks?.cleaning_activities?.name || "Unknown Activity"}
                        </span>
                        <span>·</span>
                        <span>
                          {new Date(d.created_at).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      {d.assignee && (
                        <p className="text-xs text-muted-foreground">
                          Assigned to {d.assignee.first_name} {d.assignee.last_name}
                        </p>
                      )}
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
            </Link>
          )
        })
      )}
    </div>
  )
}
