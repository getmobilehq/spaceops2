"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartTooltip } from "@/components/charts/chart-tooltip"

interface TrendPoint {
  date: string
  passed: number
  failed: number
  done: number
}

const COLORS = {
  passed: "hsl(var(--success))",
  failed: "hsl(var(--destructive))",
  done: "hsl(var(--warning))",
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
  }))

  return (
    <div className="h-[300px] w-full">
      {/* Custom legend */}
      <div className="flex items-center gap-4 mb-3">
        {[
          { key: "passed", label: "Passed", color: COLORS.passed },
          { key: "failed", label: "Failed", color: COLORS.failed },
          { key: "done", label: "Awaiting Inspection", color: COLORS.done },
        ].map((item) => (
          <div key={item.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="hsl(var(--border))"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
          />
          <Bar
            dataKey="passed"
            name="Passed"
            fill={COLORS.passed}
            radius={[0, 0, 0, 0]}
            stackId="a"
            barSize={15}
            animationDuration={800}
          />
          <Bar
            dataKey="failed"
            name="Failed"
            fill={COLORS.failed}
            radius={[0, 0, 0, 0]}
            stackId="a"
            barSize={15}
            animationDuration={800}
          />
          <Bar
            dataKey="done"
            name="Awaiting Inspection"
            fill={COLORS.done}
            radius={[15, 15, 0, 0]}
            stackId="a"
            barSize={15}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
