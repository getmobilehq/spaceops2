"use client"

import { useEffect, useState } from "react"

function easeOutQuart(t: number) {
  return 1 - Math.pow(1 - t, 4)
}

export function useCountUp({
  end,
  duration = 800,
}: {
  end: number
  duration?: number
}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (end === 0) {
      setValue(0)
      return
    }

    let start: number | null = null
    let raf: number

    function step(timestamp: number) {
      if (start === null) start = timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(easeOutQuart(progress) * end))

      if (progress < 1) {
        raf = requestAnimationFrame(step)
      }
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, duration])

  return value
}
