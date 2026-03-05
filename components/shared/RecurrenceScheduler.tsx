"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

const DAYS = [
  { key: "monday", label: "M" },
  { key: "tuesday", label: "T" },
  { key: "wednesday", label: "W" },
  { key: "thursday", label: "T" },
  { key: "friday", label: "F" },
  { key: "saturday", label: "S" },
  { key: "sunday", label: "S" },
] as const

interface TimeSlot {
  window_start: string
  window_end: string
  label?: string
}

interface RecurrenceValue {
  recurrenceDays: string[]
  timeSlots: TimeSlot[]
  recurrencePreset: string | null
}

const PRESETS: { key: string; label: string; days: string[]; slots: TimeSlot[] }[] = [
  {
    key: "once_daily",
    label: "Once daily",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    slots: [{ window_start: "08:00", window_end: "17:00" }],
  },
  {
    key: "twice_daily",
    label: "Twice daily",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    slots: [
      { window_start: "06:00", window_end: "10:00", label: "Morning" },
      { window_start: "14:00", window_end: "18:00", label: "Afternoon" },
    ],
  },
  {
    key: "three_daily",
    label: "3x daily",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    slots: [
      { window_start: "06:00", window_end: "09:00", label: "Morning" },
      { window_start: "11:00", window_end: "14:00", label: "Midday" },
      { window_start: "16:00", window_end: "19:00", label: "Evening" },
    ],
  },
  {
    key: "custom",
    label: "Custom",
    days: [],
    slots: [{ window_start: "08:00", window_end: "17:00" }],
  },
]

export function RecurrenceScheduler({
  value,
  onChange,
}: {
  value: RecurrenceValue
  onChange: (value: RecurrenceValue) => void
}) {
  function selectPreset(presetKey: string) {
    const preset = PRESETS.find((p) => p.key === presetKey)
    if (!preset) return

    if (presetKey === "custom") {
      onChange({
        ...value,
        recurrencePreset: "custom",
      })
    } else {
      onChange({
        recurrenceDays: preset.days,
        timeSlots: preset.slots,
        recurrencePreset: presetKey,
      })
    }
  }

  function toggleDay(day: string) {
    const next = value.recurrenceDays.includes(day)
      ? value.recurrenceDays.filter((d) => d !== day)
      : [...value.recurrenceDays, day]
    onChange({ ...value, recurrenceDays: next, recurrencePreset: "custom" })
  }

  function updateSlot(index: number, field: keyof TimeSlot, val: string) {
    const slots = value.timeSlots.map((s, i) =>
      i === index ? { ...s, [field]: val } : s
    )
    onChange({ ...value, timeSlots: slots, recurrencePreset: "custom" })
  }

  function addSlot() {
    if (value.timeSlots.length >= 3) return
    onChange({
      ...value,
      timeSlots: [
        ...value.timeSlots,
        { window_start: "12:00", window_end: "16:00" },
      ],
      recurrencePreset: "custom",
    })
  }

  function removeSlot(index: number) {
    if (value.timeSlots.length <= 1) return
    onChange({
      ...value,
      timeSlots: value.timeSlots.filter((_, i) => i !== index),
      recurrencePreset: "custom",
    })
  }

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Frequency</Label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              type="button"
              size="sm"
              variant={value.recurrencePreset === p.key ? "default" : "outline"}
              onClick={() => selectPreset(p.key)}
              className="h-8 text-xs"
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Day pills */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Days</Label>
        <div className="flex gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDay(d.key)}
              className={`h-9 w-9 rounded-full text-xs font-medium transition-colors ${
                value.recurrenceDays.includes(d.key)
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Time Slots</Label>
          {value.timeSlots.length < 3 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addSlot}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add slot
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {value.timeSlots.map((slot, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-3">
                <Input
                  type="text"
                  placeholder="Label"
                  value={slot.label || ""}
                  onChange={(e) => updateSlot(i, "label", e.target.value)}
                  className="h-8 w-24 text-xs"
                />
                <Input
                  type="time"
                  value={slot.window_start}
                  onChange={(e) => updateSlot(i, "window_start", e.target.value)}
                  className="h-8 w-28 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={slot.window_end}
                  onChange={(e) => updateSlot(i, "window_end", e.target.value)}
                  className="h-8 w-28 text-xs"
                />
                {value.timeSlots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSlot(i)}
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
