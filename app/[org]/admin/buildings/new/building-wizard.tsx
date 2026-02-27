"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import {
  buildingDetailsSchema,
  buildingFloorsSchema,
  type BuildingDetailsInput,
  type FloorEntryInput,
} from "@/lib/validations/building"
import {
  createClientSchema,
  type CreateClientInput,
} from "@/lib/validations/client"
import { createBuilding } from "@/actions/buildings"
import { createNewClient } from "@/actions/clients"
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
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ClientOption {
  id: string
  companyName: string
}

const STEPS = ["Details", "Client", "Floors", "Confirm"] as const

export function BuildingWizard({
  clients: initialClients,
  orgSlug,
}: {
  clients: ClientOption[]
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState(initialClients)
  const [showNewClient, setShowNewClient] = useState(false)
  const [isCreatingClient, setIsCreatingClient] = useState(false)

  // Wizard data
  const [details, setDetails] = useState<BuildingDetailsInput>({
    name: "",
    address: "",
  })
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [floors, setFloors] = useState<FloorEntryInput[]>([
    { floorNumber: 1, floorName: "Floor 1" },
  ])

  // Step 1: Details form
  const detailsForm = useForm<BuildingDetailsInput>({
    resolver: zodResolver(buildingDetailsSchema),
    defaultValues: details,
  })

  // New client inline form
  const clientForm = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  })

  function handleDetailsNext(data: BuildingDetailsInput) {
    setDetails(data)
    setStep(1)
  }

  function handleClientNext() {
    setStep(2)
  }

  function handleFloorsNext() {
    const valid = buildingFloorsSchema.safeParse({ floors })
    if (!valid.success) {
      toast({
        title: "Validation error",
        description: valid.error.issues[0].message,
        variant: "destructive",
      })
      return
    }
    setStep(3)
  }

  function addFloor() {
    const nextNum = floors.length + 1
    setFloors([...floors, { floorNumber: nextNum, floorName: `Floor ${nextNum}` }])
  }

  function removeFloor(index: number) {
    if (floors.length <= 1) return
    setFloors(floors.filter((_, i) => i !== index))
  }

  function updateFloor(index: number, field: keyof FloorEntryInput, value: string | number) {
    const updated = [...floors]
    updated[index] = { ...updated[index], [field]: value }
    setFloors(updated)
  }

  async function handleCreateClient(data: CreateClientInput) {
    setIsCreatingClient(true)
    const result = await createNewClient(data)

    if (result.success) {
      const newClient = { id: result.id, companyName: data.companyName }
      setClients([...clients, newClient])
      setSelectedClientId(result.id)
      setShowNewClient(false)
      clientForm.reset()
      toast({ title: "Client created" })
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsCreatingClient(false)
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    const result = await createBuilding({
      name: details.name,
      address: details.address,
      clientId: selectedClientId,
      floors,
    })

    if (result.success) {
      toast({
        title: "Building created",
        description: `${details.name} has been created with ${floors.length} floor(s).`,
      })
      router.push(`/${orgSlug}/admin/buildings/${result.id}`)
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8",
                  i <= step ? "bg-brand" : "bg-muted"
                )}
              />
            )}
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                i === step
                  ? "bg-brand text-white"
                  : i < step
                    ? "bg-brand/20 text-brand"
                    : "bg-muted text-muted-foreground"
              )}
            >
              <span>{i + 1}</span>
              <span>{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 0 && (
        <Card>
          <form onSubmit={detailsForm.handleSubmit(handleDetailsNext)}>
            <CardHeader>
              <CardTitle>Building Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Building Name</Label>
                <Input
                  id="name"
                  placeholder="Main Office Tower"
                  {...detailsForm.register("name")}
                />
                {detailsForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {detailsForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="123 Business Ave, City, State"
                  {...detailsForm.register("address")}
                />
                {detailsForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {detailsForm.formState.errors.address.message}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit">Next</Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 2: Client */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client (optional)</Label>
              <Select
                value={selectedClientId || "none"}
                onValueChange={(v) =>
                  setSelectedClientId(v === "none" ? null : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!showNewClient ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewClient(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Client
              </Button>
            ) : (
              <div className="rounded-md border p-4 space-y-3">
                <p className="text-sm font-medium">New Client</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Company name"
                    {...clientForm.register("companyName")}
                  />
                  <Input
                    placeholder="Contact name"
                    {...clientForm.register("contactName")}
                  />
                  <Input
                    placeholder="Contact email"
                    type="email"
                    {...clientForm.register("contactEmail")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isCreatingClient}
                    onClick={clientForm.handleSubmit(handleCreateClient)}
                  >
                    {isCreatingClient ? "Creating..." : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowNewClient(false)
                      clientForm.reset()
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button onClick={handleClientNext}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Floors */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Floors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {floors.map((floor, index) => (
              <div key={index} className="flex items-end gap-3">
                <div className="w-24 space-y-1">
                  <Label className="text-xs">Number</Label>
                  <Input
                    type="number"
                    value={floor.floorNumber}
                    onChange={(e) =>
                      updateFloor(index, "floorNumber", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={floor.floorName}
                    onChange={(e) =>
                      updateFloor(index, "floorName", e.target.value)
                    }
                    placeholder="Floor name"
                  />
                </div>
                {floors.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFloor(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFloor}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Floor
            </Button>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={handleFloorsNext}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Building</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{details.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="font-medium">{details.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="font-medium">
                  {selectedClient?.companyName || "None"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Floors ({floors.length})
                </p>
                <ul className="mt-1 space-y-1">
                  {floors.map((f, i) => (
                    <li key={i} className="text-sm">
                      {f.floorName} (#{f.floorNumber})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Building"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
