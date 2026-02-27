import { createAdminClient } from "@/lib/supabase/admin"

export async function getAuthUserEmail(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) return null
  return data.user.email ?? null
}

export async function getAuthUsersForOrg(userIds: string[]) {
  const admin = createAdminClient()
  const results: Record<
    string,
    { email: string | null; last_sign_in_at: string | null }
  > = {}

  // Supabase admin API doesn't support batch user fetch,
  // so we fetch in parallel with a concurrency limit
  const batchSize = 10
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize)
    const promises = batch.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id)
      if (error || !data.user) {
        results[id] = { email: null, last_sign_in_at: null }
      } else {
        results[id] = {
          email: data.user.email ?? null,
          last_sign_in_at: data.user.last_sign_in_at ?? null,
        }
      }
    })
    await Promise.all(promises)
  }

  return results
}
