"use client"

import type { Payload } from "recharts/types/component/DefaultTooltipContent"

interface ChartTooltipProps {
  active?: boolean
  payload?: Payload<number, string>[]
  label?: string | number
  labelFormatter?: (label: string) => string
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg bg-card px-3 py-2.5 shadow-lg ring-1 ring-border">
      <p className="text-xs font-medium text-muted-foreground mb-1.5 pb-1.5 border-b border-border">
        {labelFormatter ? labelFormatter(String(label)) : label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
