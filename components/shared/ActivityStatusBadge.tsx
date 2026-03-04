import { Badge } from "@/components/ui/badge"
import { ACTIVITY_STATUS } from "@/lib/status-styles"

export function ActivityStatusBadge({ status }: { status: string }) {
  const config = ACTIVITY_STATUS[status] || ACTIVITY_STATUS.draft
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
