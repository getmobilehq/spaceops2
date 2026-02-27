"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  createTemplateSchema,
  type CreateTemplateInput,
} from "@/lib/validations/checklist"
import { createTemplate } from "@/actions/checklists"
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
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface RoomTypeOption {
  id: string
  name: string
}

export function TemplateForm({
  roomTypes,
  orgSlug,
}: {
  roomTypes: RoomTypeOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: { name: "", roomTypeId: null },
  })

  async function onSubmit(data: CreateTemplateInput) {
    setIsSubmitting(true)
    const result = await createTemplate(data)

    if (result.success) {
      toast({ title: "Template created" })
      router.push(`/${orgSlug}/admin/checklists/${result.id}`)
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              placeholder="e.g. Deep Clean Bathroom"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Room Type (optional)</Label>
            <Select
              onValueChange={(v) =>
                setValue("roomTypeId", v === "none" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General (no specific type)</SelectItem>
                {roomTypes.map((rt) => (
                  <SelectItem key={rt.id} value={rt.id}>
                    {rt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/${orgSlug}/admin/checklists`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Template"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
