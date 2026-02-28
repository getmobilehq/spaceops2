"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface TrendPoint {
  date: string
  passed: number
  failed: number
  done: number
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
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "0.875rem" }} />
          <Bar
            dataKey="passed"
            name="Passed"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="failed"
            name="Failed"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
          <Bar
            dataKey="done"
            name="Awaiting Inspection"
            fill="#eab308"
            radius={[4, 4, 0, 0]}
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
