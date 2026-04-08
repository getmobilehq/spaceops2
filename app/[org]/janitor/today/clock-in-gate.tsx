"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AttendanceQrScanner } from "@/components/shared/AttendanceQrScanner"
import { Building2, Camera, Clock } from "lucide-react"

interface ClockInGateProps {
  buildings: { id: string; name: string }[]
}

export function ClockInGate({ buildings }: ClockInGateProps) {
  const [scannerOpen, setScannerOpen] = useState(false)

  return (
    <>
      {/* Main clock-in prompt */}
      <button
        onClick={() => setScannerOpen(true)}
        className="w-full text-left active:scale-[0.98] transition-transform"
      >
        <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-primary" />
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-primary">
                  Clock In to Start Your Shift
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Scan a building QR code to clock in and view your tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </button>

      {/* Buildings assigned today */}
      {buildings.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">
                Today&apos;s Buildings
              </p>
            </div>
            <div className="space-y-2">
              {buildings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">{b.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AttendanceQrScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
      />
    </>
  )
}
