"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  updateClientSchema,
  type UpdateClientInput,
} from "@/lib/validations/client"
import { updateClient, deleteClient } from "@/actions/clients"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface ClientWithBuildings {
  id: string
  company_name: string
  contact_name: string
  contact_email: string
  buildings: { id: string; name: string; status: string; address: string }[]
}

export function EditClientForm({
  client,
  orgSlug,
}: {
  client: ClientWithBuildings
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateClientInput>({
    resolver: zodResolver(updateClientSchema),
    defaultValues: {
      clientId: client.id,
      companyName: client.company_name,
      contactName: client.contact_name,
      contactEmail: client.contact_email,
    },
  })

  async function handleDeleteClient() {
    setIsDeleting(true)
    const result = await deleteClient({ clientId: client.id })
    if (result.success) {
      toast({ title: "Client deleted" })
      router.push(`/${orgSlug}/admin/clients`)
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function onSubmit(data: UpdateClientInput) {
    setIsLoading(true)
    const result = await updateClient(data)

    if (result.success) {
      toast({
        title: "Client updated",
        description: "Client details have been saved.",
      })
      router.push(`/${orgSlug}/admin/clients`)
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

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    setup: "secondary",
    active: "default",
    inactive: "destructive",
  }

  return (
    <>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input type="hidden" {...register("clientId")} />
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && (
                <p className="text-sm text-destructive">
                  {errors.companyName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" {...register("contactName")} />
              {errors.contactName && (
                <p className="text-sm text-destructive">
                  {errors.contactName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Linked Buildings */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Buildings</CardTitle>
        </CardHeader>
        <CardContent>
          {client.buildings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No buildings linked to this client yet.
            </p>
          ) : (
            <div className="space-y-3">
              {client.buildings.map((building) => (
                <Link
                  key={building.id}
                  href={`/${orgSlug}/admin/buildings/${building.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium">{building.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {building.address}
                    </p>
                  </div>
                  <Badge variant={statusVariant[building.status] || "outline"}>
                    {building.status.charAt(0).toUpperCase() +
                      building.status.slice(1)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete client confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{client.company_name}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClient}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
