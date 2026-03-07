"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createBuilding } from "@/actions/buildings"
import { inviteUser } from "@/actions/users"
import { completeOnboarding } from "@/actions/onboarding"
import {
  Building2,
  Users,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  SkipForward,
} from "lucide-react"

const buildingSchema = z.object({
  name: z.string().min(1, "Building name is required").max(100),
  address: z.string().min(1, "Street address is required").max(200),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  zipCode: z.string().min(1, "ZIP code is required").max(20),
  country: z.string().min(1, "Country is required").max(100),
})

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["admin", "supervisor", "janitor", "client"]),
})

type BuildingFormData = z.infer<typeof buildingSchema>
type InviteFormData = z.infer<typeof inviteSchema>

const STEPS = [
  { label: "Welcome", icon: Rocket },
  { label: "Building", icon: Building2 },
  { label: "Team", icon: Users },
  { label: "Finish", icon: CheckCircle2 },
]

export function OnboardingWizard({
  orgSlug,
  orgName,
  firstName,
  plan,
}: {
  orgSlug: string
  orgName: string
  firstName: string
  plan: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [buildingCreated, setBuildingCreated] = useState(false)
  const [userInvited, setUserInvited] = useState(false)

  const buildingForm = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: { name: "", address: "", city: "", state: "", zipCode: "", country: "United States" },
  })

  const inviteForm = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "supervisor",
    },
  })

  async function handleCreateBuilding(data: BuildingFormData) {
    setIsLoading(true)
    try {
      const result = await createBuilding({
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        clientId: null,
        floors: [{ floorNumber: 1, floorName: "Ground Floor" }],
      })
      if (result.success) {
        setBuildingCreated(true)
        toast({ title: "Building created successfully" })
        setCurrentStep(2)
      } else {
        toast({
          title: "Failed to create building",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleInviteUser(data: InviteFormData) {
    setIsLoading(true)
    try {
      const result = await inviteUser(data)
      if (result.success) {
        setUserInvited(true)
        toast({ title: "Invitation sent successfully" })
        setCurrentStep(3)
      } else {
        toast({
          title: "Failed to send invitation",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleFinish() {
    setIsLoading(true)
    try {
      const result = await completeOnboarding()
      if (result.success) {
        router.push(`/${orgSlug}/admin/dashboard`)
        router.refresh()
      } else {
        toast({
          title: "Something went wrong",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = i === currentStep
          const isComplete = i < currentStep
          return (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-8 ${
                    isComplete ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 1: Welcome */}
      {currentStep === 0 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Welcome to SpaceOps, {firstName}!
            </CardTitle>
            <CardDescription className="text-base">
              Let&apos;s get <strong>{orgName}</strong> set up. This will only
              take a couple of minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Add a building</p>
                <p className="text-xs text-muted-foreground">
                  Set up your first location
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Invite your team</p>
                <p className="text-xs text-muted-foreground">
                  Add supervisors or janitors
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">You&apos;re all set</p>
                <p className="text-xs text-muted-foreground">
                  Start managing operations
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => setCurrentStep(1)}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Create Building */}
      {currentStep === 1 && (
        <Card>
          <form onSubmit={buildingForm.handleSubmit(handleCreateBuilding)}>
            <CardHeader>
              <CardTitle>Create Your First Building</CardTitle>
              <CardDescription>
                Add the building or location you&apos;ll be managing. You can add
                more later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="building-name">Building Name</Label>
                <Input
                  id="building-name"
                  placeholder="e.g. Main Office"
                  {...buildingForm.register("name")}
                />
                {buildingForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {buildingForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="building-address">Street Address</Label>
                <Input
                  id="building-address"
                  placeholder="e.g. 123 Main Street"
                  {...buildingForm.register("address")}
                />
                {buildingForm.formState.errors.address && (
                  <p className="text-sm text-destructive">
                    {buildingForm.formState.errors.address.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building-city">City</Label>
                  <Input
                    id="building-city"
                    placeholder="New York"
                    {...buildingForm.register("city")}
                  />
                  {buildingForm.formState.errors.city && (
                    <p className="text-sm text-destructive">
                      {buildingForm.formState.errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building-state">State</Label>
                  <Input
                    id="building-state"
                    placeholder="NY"
                    {...buildingForm.register("state")}
                  />
                  {buildingForm.formState.errors.state && (
                    <p className="text-sm text-destructive">
                      {buildingForm.formState.errors.state.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="building-zip">ZIP Code</Label>
                  <Input
                    id="building-zip"
                    placeholder="10001"
                    {...buildingForm.register("zipCode")}
                  />
                  {buildingForm.formState.errors.zipCode && (
                    <p className="text-sm text-destructive">
                      {buildingForm.formState.errors.zipCode.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="building-country">Country</Label>
                  <Input
                    id="building-country"
                    placeholder="United States"
                    {...buildingForm.register("country")}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(0)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Building"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 3: Invite Team Member */}
      {currentStep === 2 && (
        <Card>
          <form onSubmit={inviteForm.handleSubmit(handleInviteUser)}>
            <CardHeader>
              <CardTitle>Invite a Team Member</CardTitle>
              <CardDescription>
                Add a supervisor or janitor to your team. You can invite more
                people later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-firstName">First Name</Label>
                  <Input
                    id="invite-firstName"
                    placeholder="John"
                    {...inviteForm.register("firstName")}
                  />
                  {inviteForm.formState.errors.firstName && (
                    <p className="text-sm text-destructive">
                      {inviteForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-lastName">Last Name</Label>
                  <Input
                    id="invite-lastName"
                    placeholder="Smith"
                    {...inviteForm.register("lastName")}
                  />
                  {inviteForm.formState.errors.lastName && (
                    <p className="text-sm text-destructive">
                      {inviteForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="john@example.com"
                  {...inviteForm.register("email")}
                />
                {inviteForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {inviteForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  defaultValue="supervisor"
                  onValueChange={(val) =>
                    inviteForm.setValue(
                      "role",
                      val as "admin" | "supervisor" | "janitor" | "client"
                    )
                  }
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="janitor">Janitor</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Step 4: Review & Finish */}
      {currentStep === 3 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
            <CardDescription>
              Here&apos;s a summary of your setup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Building</span>
                </div>
                {buildingCreated ? (
                  <Badge>Created</Badge>
                ) : (
                  <Badge variant="secondary">Skipped</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Team Member</span>
                </div>
                {userInvited ? (
                  <Badge>Invited</Badge>
                ) : (
                  <Badge variant="secondary">Skipped</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Plan</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {plan}
                </Badge>
              </div>
            </div>
            {plan === "free" && (
              <p className="text-sm text-muted-foreground text-center">
                You&apos;re on the Free plan.{" "}
                <a
                  href={`/${orgSlug}/admin/billing`}
                  className="text-primary hover:underline"
                >
                  Explore upgrade options
                </a>{" "}
                to unlock more features.
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleFinish} disabled={isLoading}>
              {isLoading ? "Finishing..." : "Go to Dashboard"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
