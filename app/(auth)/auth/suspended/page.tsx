import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { SignOutButton } from "@/components/shared/SignOutButton"

export const metadata = {
  title: "Account Suspended - SpaceOps",
}

export default async function SuspendedPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let reason: string | null = null
  if (user) {
    const orgId = user.app_metadata?.org_id as string | undefined
    if (orgId) {
      const { data: org } = await supabase
        .from("organisations")
        .select("name, suspended_reason")
        .eq("id", orgId)
        .single()
      reason = org?.suspended_reason || null
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="mt-4">Account Suspended</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your organisation&apos;s account has been suspended. Please contact
          support to restore access.
        </p>
        {reason && (
          <div className="rounded-md bg-muted p-3 text-left">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Reason
            </p>
            <p className="text-sm">{reason}</p>
          </div>
        )}
        <SignOutButton />
      </CardContent>
    </Card>
  )
}
