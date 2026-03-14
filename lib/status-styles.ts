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
  labelKey: string
  className: string
  icon?: LucideIcon
}

/* ─── deficiency / issue status ─── */
export const ISSUE_STATUS: Record<string, BadgeStyle> = {
  open: {
    label: "Open",
    labelKey: "status.open",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: AlertTriangle,
  },
  in_progress: {
    label: "In Progress",
    labelKey: "status.inProgress",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  resolved: {
    label: "Resolved",
    labelKey: "status.resolved",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
}

/* ─── deficiency / issue severity ─── */
export const ISSUE_SEVERITY: Record<string, BadgeStyle> = {
  low: {
    label: "Low",
    labelKey: "severity.low",
    className: "border-info/30 bg-info/10 text-info dark:bg-info/20",
  },
  medium: {
    label: "Medium",
    labelKey: "severity.medium",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
  },
  high: {
    label: "High",
    labelKey: "severity.high",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── activity status ─── */
export const ACTIVITY_STATUS: Record<string, BadgeStyle> = {
  draft: {
    label: "Draft",
    labelKey: "activityStatus.draft",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  active: {
    label: "Active",
    labelKey: "activityStatus.active",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
  },
  closed: {
    label: "Closed",
    labelKey: "activityStatus.closed",
    className: "border-info/30 bg-info/10 text-info dark:bg-info/20",
  },
  cancelled: {
    label: "Cancelled",
    labelKey: "activityStatus.cancelled",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── room task status (janitor / floor plan) ─── */
export const TASK_STATUS: Record<string, BadgeStyle> = {
  not_started: {
    label: "Not Started",
    labelKey: "taskStatus.notStarted",
    className:
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    icon: Circle,
  },
  in_progress: {
    label: "In Progress",
    labelKey: "taskStatus.inProgress",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  done: {
    label: "Done",
    labelKey: "taskStatus.done",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
  has_issues: {
    label: "Has Issues",
    labelKey: "taskStatus.hasIssues",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: AlertTriangle,
  },
}

/* ─── inspection result status (janitor history) ─── */
export const INSPECTION_STATUS: Record<string, BadgeStyle> = {
  done: {
    label: "Awaiting Inspection",
    labelKey: "inspectionStatus.awaitingInspection",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
    icon: Clock,
  },
  inspected_pass: {
    label: "Passed",
    labelKey: "inspectionStatus.passed",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
    icon: CheckCircle2,
  },
  inspected_fail: {
    label: "Failed",
    labelKey: "inspectionStatus.failed",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
    icon: XCircle,
  },
}

/* ─── building status ─── */
export const BUILDING_STATUS: Record<string, BadgeStyle> = {
  setup: {
    label: "Setup",
    labelKey: "buildingStatus.setup",
    className:
      "border-warning/30 bg-warning/10 text-warning dark:bg-warning/20",
  },
  active: {
    label: "Active",
    labelKey: "buildingStatus.active",
    className:
      "border-success/30 bg-success/10 text-success dark:bg-success/20",
  },
  inactive: {
    label: "Inactive",
    labelKey: "buildingStatus.inactive",
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20",
  },
}

/* ─── floor plan pin colors ─── */
export const FLOOR_PLAN_PIN: Record<
  string,
  { label: string; labelKey: string; pinColor: string; fillColor: string }
> = {
  not_started: {
    label: "Not Started",
    labelKey: "taskStatus.notStarted",
    pinColor: "text-muted-foreground",
    fillColor: "fill-muted",
  },
  in_progress: {
    label: "In Progress",
    labelKey: "taskStatus.inProgress",
    pinColor: "text-warning",
    fillColor: "fill-warning/30",
  },
  done: {
    label: "Done",
    labelKey: "taskStatus.done",
    pinColor: "text-info",
    fillColor: "fill-info/30",
  },
  has_issues: {
    label: "Has Issues",
    labelKey: "taskStatus.hasIssues",
    pinColor: "text-destructive",
    fillColor: "fill-destructive/30",
  },
  inspected_pass: {
    label: "Passed",
    labelKey: "inspectionStatus.passed",
    pinColor: "text-success",
    fillColor: "fill-success/30",
  },
  inspected_fail: {
    label: "Failed",
    labelKey: "inspectionStatus.failed",
    pinColor: "text-destructive",
    fillColor: "fill-destructive/40",
  },
}
