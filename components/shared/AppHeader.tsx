"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Menu, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AppSidebar } from "./AppSidebar"
import { LocaleSwitcher } from "./LocaleSwitcher"
import { NotificationBell } from "./NotificationBell"
import { ThemeToggle } from "./ThemeToggle"
import { useOrg } from "@/components/shared/OrgProvider"
import { useTranslation } from "@/lib/i18n/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOutAction } from "@/actions/auth"

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const {
    orgSlug,
    orgName,
    orgLogoUrl,
    userFirstName,
    userLastName,
    userAvatarUrl,
    userEmail,
  } = useOrg()
  const { t } = useTranslation()
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const role = segments[1] || "admin"
  const userInitials =
    (userFirstName.charAt(0) + userLastName.charAt(0)).toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-40 flex h-header items-center gap-3 border-b bg-card/80 px-4 lg:px-6 backdrop-blur-lg">
      {/* Mobile hamburger */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">{t("header.toggleMenu")}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px] p-0">
            <AppSidebar
              className="border-r-0 h-full"
              onNavClick={() => setOpen(false)}
              forceExpanded
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile org branding */}
      <div className="flex items-center gap-2 flex-1 min-w-0 lg:hidden">
        <Avatar className="h-7 w-7">
          <AvatarImage src={orgLogoUrl || undefined} alt={orgName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {orgName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold text-foreground">
          {orgName}
        </span>
      </div>

      {/* Desktop spacer */}
      <div className="hidden lg:flex flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={userAvatarUrl || undefined}
                  alt={userFirstName}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {userFirstName} {userLastName}
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${orgSlug}/${role}/profile`}>
                <User className="mr-2 h-4 w-4" />
                {t("header.profileAndSettings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const form = document.createElement("form")
                form.method = "POST"
                form.style.display = "none"
                document.body.appendChild(form)
                signOutAction()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
