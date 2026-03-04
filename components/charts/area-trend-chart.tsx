"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ChartTooltip } from "./chart-tooltip"

interface AreaTrendChartProps {
  data: { label: string; value: number }[]
  color?: string
  height?: number
  valueSuffix?: string
}

export function AreaTrendChart({
  data,
  color = "hsl(var(--primary))",
  height = 300,
  valueSuffix = "",
}: AreaTrendChartProps) {
  const gradientId = "areaTrendGradient"

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${v}${valueSuffix}`}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Pass Rate"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
