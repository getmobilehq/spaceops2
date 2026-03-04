"use client"

import { useCountUp } from "@/hooks/use-count-up"

export function AnimatedNumber({ value }: { value: number }) {
  const display = useCountUp({ end: value })
  return <>{display}</>
}
