import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function getOrgTemplates(
  supabase: SupabaseClient<Database>
) {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*, room_types(name), checklist_items(id)")
    .order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getTemplateById(
  supabase: SupabaseClient<Database>,
  templateId: string
) {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("*, room_types(id, name), checklist_items(*)")
    .eq("id", templateId)
    .single()

  if (error) throw error

  // Sort items by item_order client-side (Supabase doesn't support ordering nested)
  if (data.checklist_items && Array.isArray(data.checklist_items)) {
    data.checklist_items.sort((a, b) => a.item_order - b.item_order)
  }

  return data
}

export async function getTemplatesByRoomType(
  supabase: SupabaseClient<Database>,
  roomTypeId: string
) {
  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, name, is_default")
    .eq("room_type_id", roomTypeId)
    .order("name", { ascending: true })

  if (error) throw error
  return data
}

export async function getRoomOverride(
  supabase: SupabaseClient<Database>,
  roomId: string
) {
  const { data, error } = await supabase
    .from("room_checklist_overrides")
    .select("*, checklist_templates(name)")
    .eq("room_id", roomId)
    .maybeSingle()

  if (error) throw error
  return data
}
