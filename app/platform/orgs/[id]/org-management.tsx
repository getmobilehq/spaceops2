"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  updateOrgPlan,
  suspendOrg,
  unsuspendOrg,
  deleteOrg,
} from "@/actions/platform"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, AlertTriangle } from "lucide-react"

interface OrgManagementProps {
  orgId: string
  orgName: string
  currentPlan: "free" | "pro" | "enterprise"
  suspendedAt: string | null
  suspendedReason: string | null
}

export function OrgManagement({
  orgId,
  orgName,
  currentPlan,
  suspendedAt,
  suspendedReason,
}: OrgManagementProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Plan change
  const [selectedPlan, setSelectedPlan] = useState<typeof currentPlan>(
    currentPlan
  )
  const [planNote, setPlanNote] = useState("")
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false)
  const [showPlanConfirm, setShowPlanConfirm] = useState(false)

  // Suspend
  const [suspendReason, setSuspendReason] = useState("")
  const [isSuspending, setIsSuspending] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [isUnsuspending, setIsUnsuspending] = useState(false)

  // Delete
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const isSuspended = !!suspendedAt

  async function handleUpdatePlan() {
    setIsUpdatingPlan(true)
    const result = await updateOrgPlan({
      orgId,
      plan: selectedPlan,
      note: planNote || undefined,
    })

    if (result.success) {
      toast({
        title: "Plan updated",
        description: `${orgName} is now on the ${selectedPlan} plan.`,
      })
      setShowPlanConfirm(false)
      setPlanNote("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsUpdatingPlan(false)
  }

  async function handleSuspend() {
    setIsSuspending(true)
    const result = await suspendOrg({ orgId, reason: suspendReason })

    if (result.success) {
      toast({
        title: "Organisation suspended",
        description: `${orgName} can no longer access the app.`,
      })
      setShowSuspendDialog(false)
      setSuspendReason("")
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsSuspending(false)
  }

  async function handleUnsuspend() {
    setIsUnsuspending(true)
    const result = await unsuspendOrg({ orgId })

    if (result.success) {
      toast({ title: "Organisation reactivated" })
      router.refresh()
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    }
    setIsUnsuspending(false)
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteOrg({ orgId })

    if (result.success) {
      toast({ title: "Organisation deleted" })
      router.push("/platform/orgs")
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

  return (
    <>
      {/* Suspended banner */}
      {isSuspended && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Suspended</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suspended on{" "}
                  {new Date(suspendedAt!).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                {suspendedReason && (
                  <p className="text-sm mt-2">
                    <span className="text-muted-foreground">Reason: </span>
                    {suspendedReason}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnsuspend}
                disabled={isUnsuspending}
              >
                {isUnsuspending ? "Reactivating..." : "Reactivate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan management */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
          <CardDescription>
            Manually assign a subscription plan. This bypasses Stripe and
            takes effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current plan:</span>
            <Badge className="capitalize">{currentPlan}</Badge>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="plan">Change to</Label>
              <Select
                value={selectedPlan}
                onValueChange={(v) => setSelectedPlan(v as typeof currentPlan)}
              >
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setShowPlanConfirm(true)}
              disabled={selectedPlan === currentPlan}
            >
              Update Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Suspending blocks all users from accessing the app. Deleting is
            permanent and removes all data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {!isSuspended && (
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(true)}
            >
              Suspend Organisation
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Organisation
          </Button>
        </CardContent>
      </Card>

      {/* Plan change confirmation */}
      <Dialog open={showPlanConfirm} onOpenChange={setShowPlanConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Plan Change</DialogTitle>
            <DialogDescription>
              Change <strong>{orgName}</strong> from{" "}
              <span className="capitalize">{currentPlan}</span> to{" "}
              <span className="capitalize">{selectedPlan}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="planNote">Note (optional)</Label>
            <Textarea
              id="planNote"
              placeholder="e.g. Comped enterprise for pilot program"
              value={planNote}
              onChange={(e) => setPlanNote(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPlanConfirm(false)}
              disabled={isUpdatingPlan}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={isUpdatingPlan}>
              {isUpdatingPlan ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend {orgName}</DialogTitle>
            <DialogDescription>
              All users in this organisation will be blocked from accessing
              the app until you reactivate it. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Payment overdue, abuse report, etc."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSuspendDialog(false)}
              disabled={isSuspending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isSuspending || !suspendReason.trim()}
            >
              {isSuspending ? "Suspending..." : "Suspend"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete {orgName}?
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the organisation, all its users,
              buildings, activities, and every other piece of data
              associated with it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Type <strong>{orgName}</strong> to confirm
            </Label>
            <Input
              id="confirmText"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setDeleteConfirmText("")
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || deleteConfirmText !== orgName}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
