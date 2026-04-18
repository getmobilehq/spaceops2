"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
import {
  approvePayrollRun,
  deletePayrollRun,
  exportPayrollRunCsv,
} from "@/actions/payroll"
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Trash2,
} from "lucide-react"
import type { PayrollRunDetail } from "@/lib/queries/payroll"

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

export function RunDetail({
  detail,
  orgSlug,
}: {
  detail: PayrollRunDetail
  orgSlug: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isApproving, setIsApproving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isDraft = detail.status === "draft"

  const totals = detail.lines.reduce(
    (acc, l) => ({
      totalHours: acc.totalHours + l.totalHours,
      regularHours: acc.regularHours + l.regularHours,
      overtimeHours: acc.overtimeHours + l.overtimeHours,
      regularPay: acc.regularPay + l.regularPay,
      overtimePay: acc.overtimePay + l.overtimePay,
      grossPay: acc.grossPay + l.grossPay,
      shifts: acc.shifts + l.shifts,
    }),
    {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      regularPay: 0,
      overtimePay: 0,
      grossPay: 0,
      shifts: 0,
    }
  )

  async function handleApprove() {
    setIsApproving(true)
    try {
      const result = await approvePayrollRun({ runId: detail.id })
      if (result.success) {
        toast({ title: "Payroll approved" })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsApproving(false)
    }
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const result = await exportPayrollRunCsv(detail.id)
      if (result.success) {
        const blob = new Blob([result.csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = result.filename
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsExporting(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const result = await deletePayrollRun({ runId: detail.id })
      if (result.success) {
        toast({ title: "Payroll run deleted" })
        router.push(`/${orgSlug}/admin/payroll`)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${orgSlug}/admin/payroll`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                {formatDate(detail.periodStart)} — {formatDate(detail.periodEnd)}
              </h1>
              <Badge
                variant={isDraft ? "outline" : "default"}
                className={!isDraft ? "bg-success text-white" : ""}
              >
                {isDraft ? "Draft" : "Approved"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {detail.employeeCount} employees ·{" "}
              {detail.createdByName && `Created by ${detail.createdByName}`}
              {detail.approvedByName &&
                ` · Approved by ${detail.approvedByName}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totals.grossPay)}
            </p>
            <p className="text-xs text-muted-foreground">Total Gross Pay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{totals.totalHours.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Total Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-warning">
              {totals.overtimeHours.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">Overtime Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{detail.employeeCount}</p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {detail.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{detail.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Line items table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Total Hrs</TableHead>
              <TableHead className="text-right">Regular Hrs</TableHead>
              <TableHead className="text-right">OT Hrs</TableHead>
              <TableHead className="text-right">Regular Pay</TableHead>
              <TableHead className="text-right">OT Pay</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="font-medium">
                  {line.employeeName}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(line.hourlyRate)}
                </TableCell>
                <TableCell className="text-right">
                  {line.totalHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {line.regularHours.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {line.overtimeHours > 0 ? (
                    <span className="text-warning font-medium">
                      {line.overtimeHours.toFixed(1)}
                    </span>
                  ) : (
                    "0.0"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(line.regularPay)}
                </TableCell>
                <TableCell className="text-right">
                  {line.overtimePay > 0 ? (
                    <span className="text-warning font-medium">
                      {formatCurrency(line.overtimePay)}
                    </span>
                  ) : (
                    formatCurrency(0)
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(line.grossPay)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell></TableCell>
              <TableCell className="text-right font-bold">
                {totals.totalHours.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {totals.regularHours.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {totals.overtimeHours.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.regularPay)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.overtimePay)}
              </TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(totals.grossPay)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Payroll Run</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this draft payroll run? This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
