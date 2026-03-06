import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  ClipboardCheck,
  UserCircle,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Eye,
  AlertTriangle,
  BookTemplate,
  Clock,
  CreditCard,
  type LucideIcon,
} from "lucide-react"
import type { PlanType } from "@/lib/plans"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  enabled: boolean
  requiredPlan?: PlanType
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Buildings", href: "buildings", icon: Building2, enabled: true },
    { label: "Clients", href: "clients", icon: UserCircle, enabled: true },
    { label: "Users", href: "users", icon: Users, enabled: true },
    { label: "Checklists", href: "checklists", icon: ClipboardCheck, enabled: true },
    { label: "Settings", href: "settings", icon: Settings, enabled: true },
    { label: "Reports", href: "reports", icon: BarChart3, enabled: true },
    { label: "Billing", href: "billing", icon: CreditCard, enabled: true },
  ],
  supervisor: [
    { label: "Dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Activities", href: "activities", icon: CalendarCheck, enabled: true },
    { label: "Templates", href: "templates", icon: BookTemplate, enabled: true },
    { label: "Attendance", href: "attendance", icon: Clock, enabled: true },
    { label: "Issues", href: "issues", icon: AlertTriangle, enabled: true },
    { label: "Reports", href: "reports", icon: BarChart3, enabled: true },
  ],
  janitor: [
    { label: "Today", href: "today", icon: CalendarDays, enabled: true },
    { label: "Attendance", href: "attendance", icon: Clock, enabled: true },
    { label: "History", href: "history", icon: ClipboardCheck, enabled: true },
    { label: "Issues", href: "issues", icon: AlertTriangle, enabled: true },
  ],
  client: [
    { label: "Overview", href: "overview", icon: Eye, enabled: true },
    { label: "Activities", href: "activities", icon: CalendarCheck, enabled: true },
    { label: "Issues", href: "issues", icon: AlertTriangle, enabled: true },
  ],
}
