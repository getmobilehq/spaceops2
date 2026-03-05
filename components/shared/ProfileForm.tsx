"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from "@/lib/validations/profile"
import { updateProfile, uploadAvatar, changePassword } from "@/actions/profile"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Upload } from "lucide-react"

interface ProfileFormProps {
  firstName: string
  lastName: string
  email: string
  role: string
  avatarUrl: string | null
  memberSince: string
}

export function ProfileForm({
  firstName,
  lastName,
  email,
  role,
  avatarUrl,
  memberSince,
}: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { firstName, lastName },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  async function onProfileSubmit(data: UpdateProfileInput) {
    setIsSavingProfile(true)
    const result = await updateProfile(data)
    if (result.success) {
      toast({ title: "Profile updated", description: "Your name has been saved." })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsSavingProfile(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    setIsUploading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    const result = await uploadAvatar(formData)
    if (result.success) {
      toast({ title: "Avatar uploaded", description: "Your avatar has been updated." })
      router.refresh()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
      setAvatarPreview(avatarUrl)
    }
    setIsUploading(false)
  }

  async function onPasswordSubmit(data: ChangePasswordInput) {
    setIsChangingPassword(true)
    const result = await changePassword(data)
    if (result.success) {
      toast({ title: "Password changed", description: "Your password has been updated." })
      resetPassword()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
    setIsChangingPassword(false)
  }

  const initials =
    (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "U"

  return (
    <div className="space-y-6">
      {/* Avatar Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload a profile photo. Max 2MB, JPEG/PNG/WebP.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview || undefined} alt={firstName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info Card */}
      <Card>
        <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...registerProfile("firstName")} />
                {profileErrors.firstName && (
                  <p className="text-sm text-destructive">
                    {profileErrors.firstName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...registerProfile("lastName")} />
                {profileErrors.lastName && (
                  <p className="text-sm text-destructive">
                    {profileErrors.lastName.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="flex items-center gap-3">
            <Label>Role</Label>
            <Badge variant="secondary" className="capitalize">
              {role}
            </Badge>
          </div>
          <div className="space-y-2">
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground">{memberSince}</p>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password. Must be at least 8 characters with
              uppercase, lowercase, and a number.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword("currentPassword")}
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">
                  {passwordErrors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
