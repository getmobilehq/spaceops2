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
  labelKey: string
  href: string
  icon: LucideIcon
  enabled: boolean
  requiredPlan?: PlanType
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", labelKey: "nav.dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Buildings", labelKey: "nav.buildings", href: "buildings", icon: Building2, enabled: true },
    { label: "Clients", labelKey: "nav.clients", href: "clients", icon: UserCircle, enabled: true },
    { label: "Users", labelKey: "nav.users", href: "users", icon: Users, enabled: true },
    { label: "Checklists", labelKey: "nav.checklists", href: "checklists", icon: ClipboardCheck, enabled: true },
    { label: "Settings", labelKey: "nav.settings", href: "settings", icon: Settings, enabled: true },
    { label: "Reports", labelKey: "nav.reports", href: "reports", icon: BarChart3, enabled: true },
    { label: "Billing", labelKey: "nav.billing", href: "billing", icon: CreditCard, enabled: true },
  ],
  supervisor: [
    { label: "Dashboard", labelKey: "nav.dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Activities", labelKey: "nav.activities", href: "activities", icon: CalendarCheck, enabled: true },
    { label: "Inspections", labelKey: "nav.inspections", href: "inspections", icon: ClipboardCheck, enabled: true },
    { label: "Templates", labelKey: "nav.templates", href: "templates", icon: BookTemplate, enabled: true },
    { label: "Attendance", labelKey: "nav.attendance", href: "attendance", icon: Clock, enabled: true },
    { label: "Issues", labelKey: "nav.issues", href: "issues", icon: AlertTriangle, enabled: true },
    { label: "Reports", labelKey: "nav.reports", href: "reports", icon: BarChart3, enabled: true },
  ],
  janitor: [
    { label: "Today", labelKey: "nav.today", href: "today", icon: CalendarDays, enabled: true },
    { label: "Attendance", labelKey: "nav.attendance", href: "attendance", icon: Clock, enabled: true },
    { label: "History", labelKey: "nav.history", href: "history", icon: ClipboardCheck, enabled: true },
    { label: "Issues", labelKey: "nav.issues", href: "issues", icon: AlertTriangle, enabled: true },
  ],
  client: [
    { label: "Overview", labelKey: "nav.overview", href: "overview", icon: Eye, enabled: true },
    { label: "Activities", labelKey: "nav.activities", href: "activities", icon: CalendarCheck, enabled: true },
    { label: "Issues", labelKey: "nav.issues", href: "issues", icon: AlertTriangle, enabled: true },
  ],
}
