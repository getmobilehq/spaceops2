import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "./AnimatedNumber"

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconClassName?: string
  trend?: { value: string; positive: boolean }
  className?: string
  animationDelay?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend,
  className,
  animationDelay,
}: StatCardProps) {
  return (
    <Card
      className={cn("relative overflow-hidden animate-fade-in-up", className)}
      style={animationDelay ? { animationDelay } : undefined}
    >
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div className="flex flex-col gap-y-0.5">
          <p className="text-lg font-medium text-foreground">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <p
              className={cn(
                "text-sm font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg",
            iconClassName || "bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-[22px] w-[22px]" />
        </div>
      </CardContent>
    </Card>
  )
}
