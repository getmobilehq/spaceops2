import { Badge } from "@/components/ui/badge"

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "border-gray-200 bg-gray-50 text-gray-700",
  },
  active: {
    label: "Active",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  closed: {
    label: "Closed",
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-700",
  },
}

export function ActivityStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.draft
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
