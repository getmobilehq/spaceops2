"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  createAdhocTaskSchema,
  type CreateAdhocTaskInput,
} from "@/lib/validations/adhoc-task"
import { createAdhocTask, uploadAdhocTaskImage } from "@/actions/adhoc-tasks"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Camera, Loader2, X } from "lucide-react"

interface NewTaskFormProps {
  orgSlug: string
  janitors: { id: string; first_name: string; last_name: string }[]
}

export function NewTaskForm({ orgSlug, janitors }: NewTaskFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateAdhocTaskInput>({
    resolver: zodResolver(createAdhocTaskSchema),
    defaultValues: {
      dueDate: new Date().toISOString().split("T")[0],
    },
  })

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function onSubmit(data: CreateAdhocTaskInput) {
    setIsLoading(true)

    const result = await createAdhocTask(data)

    if (!result.success) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    // Upload image if one was selected
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)
      await uploadAdhocTaskImage(result.id, formData)
    }

    toast({ title: "Task created" })
    router.push(`/${orgSlug}/supervisor/tasks`)
  }

  return (
    <Card>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g. Clean the Microwave"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what needs to be done..."
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Image (optional)</Label>
            {imagePreview ? (
              <div className="relative w-full rounded-md border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Task preview"
                  className="w-full h-48 object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Add Photo
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && (
                <p className="text-sm text-destructive">
                  {errors.dueDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time (optional)</Label>
              <Input id="dueTime" type="time" {...register("dueTime")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select
              onValueChange={(value) => setValue("assignedTo", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a janitor" />
              </SelectTrigger>
              <SelectContent>
                {janitors.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.first_name} {j.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedTo && (
              <p className="text-sm text-destructive">
                {errors.assignedTo.message}
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
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Task"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
