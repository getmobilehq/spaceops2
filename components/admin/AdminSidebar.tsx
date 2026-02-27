"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrg } from "@/components/shared/OrgProvider"
import { SignOutButton } from "@/components/shared/SignOutButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Users,
  Settings,
  Building2,
  ClipboardCheck,
  UserCircle,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    label: "Dashboard",
    href: "dashboard",
    icon: LayoutDashboard,
    enabled: true,
  },
  { label: "Users", href: "users", icon: Users, enabled: true },
  { label: "Settings", href: "settings", icon: Settings, enabled: true },
  {
    label: "Buildings",
    href: "buildings",
    icon: Building2,
    enabled: true,
  },
  {
    label: "Checklists",
    href: "checklists",
    icon: ClipboardCheck,
    enabled: true,
  },
  { label: "Clients", href: "clients", icon: UserCircle, enabled: true },
  { label: "Reports", href: "reports", icon: BarChart3, enabled: false },
]

export function AdminSidebar() {
  const { orgSlug, orgName, orgLogoUrl } = useOrg()
  const pathname = usePathname()
  const basePath = `/${orgSlug}/admin`

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Org header */}
      <div className="flex items-center gap-3 border-b px-4 py-5">
        <Avatar className="h-9 w-9">
          <AvatarImage src={orgLogoUrl || undefined} alt={orgName} />
          <AvatarFallback className="bg-brand text-white text-sm font-semibold">
            {orgName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold text-brand">
          {orgName}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const href = `${basePath}/${item.href}`
          const isActive = pathname.startsWith(href)
          const Icon = item.icon

          if (!item.enabled) {
            return (
              <span
                key={item.href}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
            )
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-4 py-4">
        <SignOutButton />
      </div>
    </aside>
  )
}
