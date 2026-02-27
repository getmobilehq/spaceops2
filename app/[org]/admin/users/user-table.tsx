"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, UserX, UserCheck } from "lucide-react"
import { toggleUserActive } from "@/actions/users"
import { useToast } from "@/hooks/use-toast"
import type { Tables } from "@/lib/supabase/types"

type UserWithAuth = Tables<"users"> & {
  email: string | null
  lastSignInAt: string | null
}

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "default",
  supervisor: "secondary",
  janitor: "outline",
  client: "outline",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Never"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function UserTable({
  users,
  orgSlug,
}: {
  users: UserWithAuth[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmUser, setConfirmUser] = useState<UserWithAuth | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  async function handleToggleActive() {
    if (!confirmUser) return
    setIsToggling(true)

    const result = await toggleUserActive({ userId: confirmUser.id })

    if (result.success) {
      toast({
        title: confirmUser.is_active ? "User deactivated" : "User reactivated",
        description: `${confirmUser.first_name} ${confirmUser.last_name} has been ${confirmUser.is_active ? "deactivated" : "reactivated"}.`,
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsToggling(false)
    setConfirmUser(null)
  }

  return (
    <>
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() =>
                  router.push(`/${orgSlug}/admin/users/${user.id}`)
                }
              >
                <TableCell className="font-medium">
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant[user.role] || "outline"}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.is_active ? "outline" : "destructive"}
                    className={
                      user.is_active
                        ? "border-green-200 bg-green-50 text-green-700"
                        : ""
                    }
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(user.lastSignInAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/${orgSlug}/admin/users/${user.id}`)
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmUser(user)
                        }}
                      >
                        {user.is_active ? (
                          <>
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="mr-2 h-4 w-4" />
                            Reactivate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!confirmUser}
        onOpenChange={(open) => !open && setConfirmUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmUser?.is_active ? "Deactivate" : "Reactivate"} User
            </DialogTitle>
            <DialogDescription>
              {confirmUser?.is_active
                ? `Are you sure you want to deactivate ${confirmUser?.first_name} ${confirmUser?.last_name}? They will no longer be able to sign in.`
                : `Are you sure you want to reactivate ${confirmUser?.first_name} ${confirmUser?.last_name}? They will be able to sign in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmUser(null)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              variant={confirmUser?.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isToggling
                ? "Processing..."
                : confirmUser?.is_active
                  ? "Deactivate"
                  : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
