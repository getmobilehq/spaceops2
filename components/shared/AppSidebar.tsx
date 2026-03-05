"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrg } from "@/components/shared/OrgProvider"
import { useSidebar } from "@/components/shared/SidebarProvider"
import { SignOutButton } from "@/components/shared/SignOutButton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NAV_CONFIG } from "@/lib/nav-config"
import { cn } from "@/lib/utils"
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react"
import { signOutAction } from "@/actions/auth"

interface AppSidebarProps {
  className?: string
  onNavClick?: () => void
  forceExpanded?: boolean
}

export function AppSidebar({
  className,
  onNavClick,
  forceExpanded,
}: AppSidebarProps) {
  const {
    orgSlug,
    orgName,
    orgLogoUrl,
    userFirstName,
    userLastName,
    userAvatarUrl,
    userRole,
  } = useOrg()
  const pathname = usePathname()

  let collapsed = false
  let toggle: (() => void) | undefined
  try {
    const sidebar = useSidebar()
    collapsed = forceExpanded ? false : sidebar.collapsed
    toggle = sidebar.toggle
  } catch {
    // SidebarProvider not available (e.g., in Sheet)
  }

  const segments = pathname.split("/").filter(Boolean)
  const role = segments[1] || "admin"
  const basePath = `/${orgSlug}/${role}`
  const navItems = NAV_CONFIG[role] || []

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-[80px]" : "w-[260px]",
        className
      )}
    >
      {/* Org header */}
      <div
        className={cn(
          "flex items-center border-b",
          collapsed ? "justify-center px-2 py-5" : "gap-3 px-4 py-5"
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={orgLogoUrl || undefined} alt={orgName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {orgName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-foreground">
            {orgName}
          </span>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav
          className={cn(
            "flex-1 space-y-1 overflow-y-auto py-4",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {navItems.map((item) => {
            const href = `${basePath}/${item.href}`
            const isActive = pathname.startsWith(href)
            const Icon = item.icon

            if (!item.enabled) {
              const disabledContent = (
                <span
                  key={item.href}
                  className={cn(
                    "flex items-center rounded-md text-sm text-muted-foreground/40 cursor-not-allowed",
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && item.label}
                </span>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{disabledContent}</TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }
              return disabledContent
            }

            const linkContent = (
              <Link
                key={item.href}
                href={href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-all",
                  collapsed
                    ? "justify-center px-2 py-2.5"
                    : "gap-3 px-3 py-2.5",
                  isActive
                    ? "gradient-primary text-white shadow-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && item.label}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }
            return linkContent
          })}
        </nav>
      </TooltipProvider>

      {/* Footer */}
      <div className="border-t px-3 py-3 space-y-2">
        {toggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              collapsed ? "w-full justify-center" : "w-full justify-start"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        )}

        {/* User profile link */}
        <Link
          href={`/${orgSlug}/${role}/profile`}
          onClick={onNavClick}
          className={cn(
            "flex items-center rounded-md text-sm transition-all hover:bg-accent",
            collapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={userAvatarUrl || undefined}
              alt={userFirstName}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {(userFirstName.charAt(0) + userLastName.charAt(0)).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {userFirstName} {userLastName}
              </p>
              <p className="truncate text-xs text-muted-foreground capitalize">
                {userRole}
              </p>
            </div>
          )}
        </Link>

        {/* Sign out */}
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <form action={signOutAction} className="w-full">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <SignOutButton />
        )}
      </div>
    </aside>
  )
}
