"use client"

import { signOutAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button variant="outline" size="sm" type="submit">
        Sign Out
      </Button>
    </form>
  )
}
