"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Subscribes to Supabase Realtime changes on a table and
 * calls router.refresh() when changes occur.
 *
 * @param table - The database table to watch
 * @param filter - Optional filter string (e.g., "org_id=eq.abc-123")
 */
export function useRealtimeRefresh(table: string, filter?: string) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channelName = `realtime-${table}${filter ? `-${filter}` : ""}`

    let channel = supabase.channel(channelName)

    const opts: {
      event: "*"
      schema: "public"
      table: string
      filter?: string
    } = {
      event: "*",
      schema: "public",
      table,
    }

    if (filter) {
      opts.filter = filter
    }

    channel = channel.on("postgres_changes", opts, () => {
      router.refresh()
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, router])
}
