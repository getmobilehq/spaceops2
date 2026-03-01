"use client"

export function PassRateBar({
  label,
  passed,
  failed,
  passRate,
}: {
  label: string
  passed: number
  failed: number
  passRate: number
}) {
  const total = passed + failed

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate mr-2">{label}</span>
        <span
          className={`shrink-0 font-semibold ${
            passRate >= 80
              ? "text-green-600"
              : passRate >= 50
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {passRate}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
        <div
          className="h-2 bg-green-500 transition-all"
          style={{ width: `${(passed / total) * 100}%` }}
        />
        <div
          className="h-2 bg-red-400 transition-all"
          style={{ width: `${(failed / total) * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {passed} passed · {failed} failed
        </span>
        <span>{total} inspected</span>
      </div>
    </div>
  )
}
