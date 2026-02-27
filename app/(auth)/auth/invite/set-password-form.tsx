"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  setPasswordSchema,
  type SetPasswordInput,
} from "@/lib/validations/auth"
import { updatePasswordAction } from "@/actions/auth"
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

interface SetPasswordFormProps {
  mode: "invite" | "reset"
}

export function SetPasswordForm({ mode }: SetPasswordFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  })

  async function onSubmit(data: SetPasswordInput) {
    setIsLoading(true)
    setError(null)

    const result = await updatePasswordAction(data)

    if (!result.success) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          {mode === "invite" ? "Set Your Password" : "New Password"}
        </CardTitle>
        <CardDescription className="text-center">
          {mode === "invite"
            ? "Create a secure password for your account"
            : "Enter your new password"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters with one uppercase letter, one
            lowercase letter, and one number.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Setting password..."
              : mode === "invite"
              ? "Create Account"
              : "Update Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
