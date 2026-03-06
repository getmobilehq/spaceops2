import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ThemeToggle } from "@/components/shared/ThemeToggle"

export const metadata = { title: "Platform Admin - SpaceOps" }

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const isSuperAdmin = user.app_metadata?.is_super_admin === true
  if (!isSuperAdmin) redirect("/")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-lg">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/platform"
              className="text-lg font-semibold text-primary"
            >
              SpaceOps Platform
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/platform/orgs"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Organisations
              </Link>
              <Link
                href="/platform/subscriptions"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Subscriptions
              </Link>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
