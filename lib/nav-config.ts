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
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  enabled: boolean
}

export const NAV_CONFIG: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Buildings", href: "buildings", icon: Building2, enabled: true },
    { label: "Clients", href: "clients", icon: UserCircle, enabled: true },
    { label: "Users", href: "users", icon: Users, enabled: true },
    { label: "Checklists", href: "checklists", icon: ClipboardCheck, enabled: true },
    { label: "Settings", href: "settings", icon: Settings, enabled: true },
    { label: "Reports", href: "reports", icon: BarChart3, enabled: false },
  ],
  supervisor: [
    { label: "Dashboard", href: "dashboard", icon: LayoutDashboard, enabled: true },
    { label: "Activities", href: "activities", icon: CalendarCheck, enabled: true },
  ],
  janitor: [
    { label: "Today", href: "today", icon: CalendarDays, enabled: true },
  ],
  client: [
    { label: "Overview", href: "overview", icon: Eye, enabled: true },
  ],
}
