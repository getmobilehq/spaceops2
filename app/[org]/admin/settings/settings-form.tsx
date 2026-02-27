"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  updateOrgSettingsSchema,
  type UpdateOrgSettingsInput,
} from "@/lib/validations/settings"
import { updateOrgSettings, uploadOrgLogo } from "@/actions/settings"
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
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload } from "lucide-react"
import type { Tables } from "@/lib/supabase/types"

interface SettingsFormProps {
  org: Tables<"organisations">
}

export function SettingsForm({ org }: SettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(
    org.logo_url
  )
  const [threshold, setThreshold] = useState(org.pass_threshold)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateOrgSettingsInput>({
    resolver: zodResolver(updateOrgSettingsSchema),
    defaultValues: {
      name: org.name,
      passThreshold: org.pass_threshold,
    },
  })

  async function onSubmit(data: UpdateOrgSettingsInput) {
    setIsLoading(true)
    const result = await updateOrgSettings({
      ...data,
      passThreshold: threshold,
    })

    if (result.success) {
      toast({
        title: "Settings saved",
        description: "Organisation settings have been updated.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setLogoPreview(previewUrl)

    setIsUploading(true)
    const formData = new FormData()
    formData.append("logo", file)

    const result = await uploadOrgLogo(formData)

    if (result.success) {
      toast({
        title: "Logo uploaded",
        description: "Your organisation logo has been updated.",
      })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setLogoPreview(org.logo_url)
    }
    setIsUploading(false)
  }

  return (
    <>
      {/* Logo Card */}
      <Card>
        <CardHeader>
          <CardTitle>Organisation Logo</CardTitle>
          <CardDescription>
            Upload a logo for your organisation. Max 2MB, JPEG/PNG/WebP/SVG.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={logoPreview || undefined} alt={org.name} />
            <AvatarFallback className="bg-brand text-white text-2xl font-semibold">
              {org.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* General Settings Card */}
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organisation Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Pass Threshold</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[threshold]}
                  onValueChange={([value]) => setThreshold(value)}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm font-medium text-brand">
                  {threshold}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Rooms scoring at or above this threshold will pass inspection.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
