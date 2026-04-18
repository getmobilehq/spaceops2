"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { upsertPayrollSettings } from "@/actions/payroll"
import { generatePayrollRun } from "@/actions/payroll"
import { Plus, Pencil, Loader2, Eye } from "lucide-react"
import type { PayrollRunRow } from "@/lib/queries/payroll"

interface EmployeeWithSettings {
  id: string
  firstName: string
  lastName: string
  role: string
  hourlyRate: number
  overtimeThresholdHours: number
  overtimeMultiplier: number
  hasCustomSettings: boolean
}

interface PayrollDashboardProps {
  runs: PayrollRunRow[]
  employees: EmployeeWithSettings[]
  orgSlug: string
}

const TABS = [
  { value: "runs", label: "Payroll Runs" },
  { value: "pay-rates", label: "Pay Rates" },
] as const

type TabValue = (typeof TABS)[number]["value"]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function PayrollDashboard({
  runs,
  employees,
  orgSlug,
}: PayrollDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentTab, setCurrentTab] = useState<TabValue>("runs")

  // Edit rate dialog state
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithSettings | null>(null)
  const [rateForm, setRateForm] = useState({
    hourlyRate: 15,
    overtimeThresholdHours: 40,
    overtimeMultiplier: 1.5,
  })
  const [isSavingRate, setIsSavingRate] = useState(false)

  // Generate run dialog state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    periodStart: "",
    periodEnd: "",
    notes: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)

  function openEditRate(emp: EmployeeWithSettings) {
    setEditingEmployee(emp)
    setRateForm({
      hourlyRate: emp.hourlyRate,
      overtimeThresholdHours: emp.overtimeThresholdHours,
      overtimeMultiplier: emp.overtimeMultiplier,
    })
  }

  async function handleSaveRate() {
    if (!editingEmployee) return
    setIsSavingRate(true)
    try {
      const result = await upsertPayrollSettings({
        userId: editingEmployee.id,
        hourlyRate: rateForm.hourlyRate,
        overtimeThresholdHours: rateForm.overtimeThresholdHours,
        overtimeMultiplier: rateForm.overtimeMultiplier,
      })
      if (result.success) {
        toast({ title: "Pay rate saved" })
        setEditingEmployee(null)
        router.refresh()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } finally {
      setIsSavingRate(false)
    }
  }

  async function handleGenerateRun() {
    if (!generateForm.periodStart || !generateForm.periodEnd) return
    setIsGenerating(true)
    try {
      const result = await generatePayrollRun({
        periodStart: generateForm.periodStart,
        periodEnd: generateForm.periodEnd,
        notes: generateForm.notes || undefined,
      })
      if (result.success) {
        toast({ title: "Payroll generated" })
        setShowGenerateDialog(false)
        router.push(`/${orgSlug}/admin/payroll/${result.runId}`)
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Payroll</h1>
          <p className="text-muted-foreground">
            Manage pay rates and generate payroll
          </p>
        </div>
        {currentTab === "runs" && (
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Payroll
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCurrentTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              currentTab === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== PAYROLL RUNS TAB ====== */}
      {currentTab === "runs" && (
        <>
          {runs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No payroll runs yet. Generate your first payroll.
                </p>
                <Button onClick={() => setShowGenerateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Payroll
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Employees</TableHead>
                    <TableHead className="text-right">Total Gross Pay</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="font-medium">
                        {formatDate(run.periodStart)} — {formatDate(run.periodEnd)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === "approved" ? "default" : "outline"
                          }
                          className={
                            run.status === "approved"
                              ? "bg-success text-white"
                              : ""
                          }
                        >
                          {run.status === "approved" ? "Approved" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {run.employeeCount}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(run.totalGrossPay)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(run.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/${orgSlug}/admin/payroll/${run.id}`}
                        >
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ====== PAY RATES TAB ====== */}
      {currentTab === "pay-rates" && (
        <>
          {employees.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No employees found. Add users first.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Hourly Rate</TableHead>
                    <TableHead className="text-right">OT Threshold (hrs)</TableHead>
                    <TableHead className="text-right">OT Multiplier</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {emp.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            emp.hasCustomSettings ? "" : "text-muted-foreground"
                          }
                        >
                          {formatCurrency(emp.hourlyRate)}
                        </span>
                        {!emp.hasCustomSettings && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs text-muted-foreground"
                          >
                            default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            emp.hasCustomSettings ? "" : "text-muted-foreground"
                          }
                        >
                          {emp.overtimeThresholdHours}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            emp.hasCustomSettings ? "" : "text-muted-foreground"
                          }
                        >
                          {emp.overtimeMultiplier}x
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditRate(emp)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ====== EDIT RATE DIALOG ====== */}
      <Dialog
        open={!!editingEmployee}
        onOpenChange={(open) => !open && setEditingEmployee(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pay Rate</DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? `${editingEmployee.firstName} ${editingEmployee.lastName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={rateForm.hourlyRate}
                onChange={(e) =>
                  setRateForm((f) => ({
                    ...f,
                    hourlyRate: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otThreshold">Overtime Threshold (hours)</Label>
              <Input
                id="otThreshold"
                type="number"
                step="0.5"
                min="0"
                max="168"
                value={rateForm.overtimeThresholdHours}
                onChange={(e) =>
                  setRateForm((f) => ({
                    ...f,
                    overtimeThresholdHours: parseFloat(e.target.value) || 0,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Hours beyond this threshold are paid at the overtime rate
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otMultiplier">Overtime Multiplier</Label>
              <Input
                id="otMultiplier"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={rateForm.overtimeMultiplier}
                onChange={(e) =>
                  setRateForm((f) => ({
                    ...f,
                    overtimeMultiplier: parseFloat(e.target.value) || 1,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                e.g. 1.5 = time-and-a-half, 2.0 = double time
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEmployee(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveRate} disabled={isSavingRate}>
              {isSavingRate ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== GENERATE PAYROLL DIALOG ====== */}
      <Dialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
            <DialogDescription>
              Calculate pay for all employees based on their attendance records
              and pay rates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">Period Start</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={generateForm.periodStart}
                  onChange={(e) =>
                    setGenerateForm((f) => ({
                      ...f,
                      periodStart: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="periodEnd">Period End</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={generateForm.periodEnd}
                  onChange={(e) =>
                    setGenerateForm((f) => ({
                      ...f,
                      periodEnd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g. Bi-weekly payroll, April 1-15"
                value={generateForm.notes}
                onChange={(e) =>
                  setGenerateForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateRun}
              disabled={
                isGenerating ||
                !generateForm.periodStart ||
                !generateForm.periodEnd
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
