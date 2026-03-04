import type { LucideIcon } from "lucide-react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
} from "lucide-react"

/* ─── badge style type ─── */
export interface BadgeStyle {
  label: string
  className: string
  icon?: LucideIcon
}

/* ─── deficiency / issue status ─── */
export const ISSUE_STATUS: Record<string, BadgeStyle> = {
  open: {
    label: "Open",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
}

/* ─── deficiency / issue severity ─── */
export const ISSUE_SEVERITY: Record<string, BadgeStyle> = {
  low: {
    label: "Low",
    className: "border-info/30 bg-info/10 text-info dark:bg-info/20",
  },
  medium: {
    label: "Medium",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
  },
  high: {
    label: "High",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── activity status ─── */
export const ACTIVITY_STATUS: Record<string, BadgeStyle> = {
  draft: {
    label: "Draft",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  active: {
    label: "Active",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
  },
  closed: {
    label: "Closed",
    className: "border-info/30 bg-info/10 text-info dark:bg-info/20",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── room task status (janitor / floor plan) ─── */
export const TASK_STATUS: Record<string, BadgeStyle> = {
  not_started: {
    label: "Not Started",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  done: {
    label: "Done",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
  has_issues: {
    label: "Has Issues",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: AlertTriangle,
  },
}

/* ─── inspection result status (janitor history) ─── */
export const INSPECTION_STATUS: Record<string, BadgeStyle> = {
  done: {
    label: "Awaiting Inspection",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  inspected_pass: {
    label: "Passed",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
  inspected_fail: {
    label: "Failed",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: XCircle,
  },
}

/* ─── building status ─── */
export const BUILDING_STATUS: Record<string, BadgeStyle> = {
  setup: {
    label: "Setup",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
  },
  active: {
    label: "Active",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
  },
  inactive: {
    label: "Inactive",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── floor plan pin colors ─── */
export const FLOOR_PLAN_PIN: Record<
  string,
  { label: string; pinColor: string; fillColor: string }
> = {
  not_started: {
    label: "Not Started",
    pinColor: "text-muted-foreground",
    fillColor: "fill-muted",
  },
  in_progress: {
    label: "In Progress",
    pinColor: "text-warning",
    fillColor: "fill-warning/30",
  },
  done: {
    label: "Done",
    pinColor: "text-info",
    fillColor: "fill-info/30",
  },
  has_issues: {
    label: "Has Issues",
    pinColor: "text-destructive",
    fillColor: "fill-destructive/30",
  },
  inspected_pass: {
    label: "Passed",
    pinColor: "text-success",
    fillColor: "fill-success/30",
  },
  inspected_fail: {
    label: "Failed",
    pinColor: "text-destructive",
    fillColor: "fill-destructive/40",
  },
}
