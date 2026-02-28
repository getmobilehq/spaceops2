import { RoleGuard } from "@/components/shared/RoleGuard"
import { AppLayout } from "@/components/shared/AppLayout"
import { Toaster } from "@/components/ui/toaster"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={["client"]}>
      <AppLayout mainClassName="flex-1 p-6 lg:p-8 max-w-6xl mx-auto">
        {children}
      </AppLayout>
      <Toaster />
    </RoleGuard>
  )
}
