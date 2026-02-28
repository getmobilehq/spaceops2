"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { AppSidebar } from "./AppSidebar"
import { NotificationBell } from "./NotificationBell"
import { useOrg } from "@/components/shared/OrgProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AppHeader() {
  const [open, setOpen] = useState(false)
  const { orgName, orgLogoUrl } = useOrg()

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar
            className="border-r-0 h-full"
            onNavClick={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Compact org branding */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Avatar className="h-7 w-7">
          <AvatarImage src={orgLogoUrl || undefined} alt={orgName} />
          <AvatarFallback className="bg-brand text-white text-xs font-semibold">
            {orgName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-semibold text-brand">
          {orgName}
        </span>
      </div>

      <NotificationBell />
    </header>
  )
}
