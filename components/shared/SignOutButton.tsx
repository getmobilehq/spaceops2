"use client"

import { signOutAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/client"

export function SignOutButton() {
  const { t } = useTranslation()

  return (
    <form action={signOutAction}>
      <Button variant="outline" size="sm" type="submit">
        {t("sidebar.signOut")}
      </Button>
    </form>
  )
}
