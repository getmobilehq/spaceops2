import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getActivityTemplates(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("activity_templates")
    .select(
      "*, floors(floor_name, building_id, buildings(name)), users!activity_templates_created_by_fkey(first_name, last_name)"
    )
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getActivityTemplateById(
  supabase: SupabaseClient<Database>,
  templateId: string
) {
  const { data, error } = await supabase
    .from("activity_templates")
    .select(
      "*, floors(id, floor_name, building_id, buildings(id, name)), users!activity_templates_created_by_fkey(first_name, last_name)"
    )
    .eq("id", templateId)
    .single()

  if (error) throw error
  return data
}
