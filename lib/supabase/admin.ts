import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// WARNING: This client bypasses RLS.
// Only use for admin operations that require elevated privileges:
// - Creating auth users (invite flow)
// - Updating user roles
// - Deactivating users
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
