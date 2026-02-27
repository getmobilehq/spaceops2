"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  updateUserSchema,
  type UpdateUserInput,
  ROLE_OPTIONS,
} from "@/lib/validations/user"
import { updateUser, toggleUserActive } from "@/actions/users"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Tables } from "@/lib/supabase/types"

interface EditUserFormProps {
  user: Tables<"users">
  email: string | null
  orgSlug: string
}

export function EditUserForm({ user, email, orgSlug }: EditUserFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
  })

  async function onSubmit(data: UpdateUserInput) {
    setIsLoading(true)
    const result = await updateUser(data)

    if (result.success) {
      toast({
        title: "User updated",
        description: "User details have been saved.",
      })
      router.push(`/${orgSlug}/admin/users`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  async function handleToggleActive() {
    setIsToggling(true)
    const result = await toggleUserActive({ userId: user.id })

    if (result.success) {
      toast({
        title: user.is_active ? "User deactivated" : "User reactivated",
        description: `${user.first_name} ${user.last_name} has been ${user.is_active ? "deactivated" : "reactivated"}.`,
      })
      router.push(`/${orgSlug}/admin/users`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }

    setIsToggling(false)
    setShowConfirm(false)
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              {email && (
                <span className="text-muted-foreground">{email}</span>
              )}
              {" · "}
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" {...register("userId")} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && (
                  <p className="text-sm text-destructive">
                    {errors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && (
                  <p className="text-sm text-destructive">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                defaultValue={user.role}
                onValueChange={(value) =>
                  setValue("role", value as UpdateUserInput["role"])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            {user.is_active
              ? "Deactivating this user will prevent them from signing in."
              : "This user is currently inactive and cannot sign in."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={user.is_active ? "destructive" : "default"}
            onClick={() => setShowConfirm(true)}
          >
            {user.is_active ? "Deactivate User" : "Reactivate User"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.is_active ? "Deactivate" : "Reactivate"} User
            </DialogTitle>
            <DialogDescription>
              {user.is_active
                ? `Are you sure you want to deactivate ${user.first_name} ${user.last_name}? They will no longer be able to sign in.`
                : `Are you sure you want to reactivate ${user.first_name} ${user.last_name}?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              variant={user.is_active ? "destructive" : "default"}
              onClick={handleToggleActive}
              disabled={isToggling}
            >
              {isToggling
                ? "Processing..."
                : user.is_active
                  ? "Deactivate"
                  : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
