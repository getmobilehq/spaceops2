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

// -- Global template types (not yet in generated Database types) ----
export type GlobalChecklistItem = {
  id: string
  template_id: string
  description: string
  item_order: number
  requires_photo: boolean
  requires_note: boolean
}

export type GlobalChecklistTemplate = {
  id: string
  room_type_name: string
  name: string
  description: string | null
  category: string
  created_at: string
  global_checklist_items: GlobalChecklistItem[]
}

export async function getGlobalTemplates(
  supabase: SupabaseClient<Database>
): Promise<GlobalChecklistTemplate[]> {
  // Cast needed: global tables not yet in generated types (run migration first, then regenerate)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("global_checklist_templates")
    .select("*, global_checklist_items(*)")
    .order("room_type_name", { ascending: true })

  if (error) throw error

  // Sort items by item_order client-side
  for (const tpl of data as unknown as GlobalChecklistTemplate[]) {
    if (tpl.global_checklist_items && Array.isArray(tpl.global_checklist_items)) {
      tpl.global_checklist_items.sort((a, b) => a.item_order - b.item_order)
    }
  }

  return data as unknown as GlobalChecklistTemplate[]
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
