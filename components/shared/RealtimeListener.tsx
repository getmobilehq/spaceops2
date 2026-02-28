"use client"

import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh"

/**
 * Invisible component that subscribes to Supabase Realtime
 * and auto-refreshes the page when changes occur on the specified table.
 */
export function RealtimeListener({
  table,
  filter,
}: {
  table: string
  filter?: string
}) {
  useRealtimeRefresh(table, filter)
  return null
}
