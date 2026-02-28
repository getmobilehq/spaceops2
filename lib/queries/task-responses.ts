import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

/**
 * Resolve the effective checklist for a room:
 * 1. Check room_checklist_overrides for this room
 * 2. If override → use that template
 * 3. Else → get default template for room's room_type
 * 4. Return template with items sorted by item_order
 */
export async function getEffectiveChecklist(
  supabase: SupabaseClient<Database>,
  roomId: string
) {
  // Check for room-specific override
  const { data: override } = await supabase
    .from("room_checklist_overrides")
    .select("template_id")
    .eq("room_id", roomId)
    .maybeSingle()

  let templateId: string | null = override?.template_id ?? null

  // If no override, look up room type's default template
  if (!templateId) {
    const { data: room } = await supabase
      .from("rooms")
      .select("room_type_id")
      .eq("id", roomId)
      .single()

    if (room?.room_type_id) {
      const { data: defaultTemplate } = await supabase
        .from("checklist_templates")
        .select("id")
        .eq("room_type_id", room.room_type_id)
        .eq("is_default", true)
        .maybeSingle()

      templateId = defaultTemplate?.id ?? null
    }
  }

  if (!templateId) return null

  // Fetch template with all items
  const { data: template, error } = await supabase
    .from("checklist_templates")
    .select("*, checklist_items(*)")
    .eq("id", templateId)
    .single()

  if (error || !template) return null

  // Sort items by item_order client-side
  if (template.checklist_items && Array.isArray(template.checklist_items)) {
    template.checklist_items.sort(
      (a: { item_order: number }, b: { item_order: number }) =>
        a.item_order - b.item_order
    )
  }

  return template
}

/**
 * Get all existing item responses for a room task.
 */
export async function getTaskItemResponses(
  supabase: SupabaseClient<Database>,
  roomTaskId: string
) {
  const { data, error } = await supabase
    .from("task_item_responses")
    .select("*")
    .eq("room_task_id", roomTaskId)

  if (error) throw error
  return data
}

/**
 * Get a room task with full context for the detail page.
 */
export async function getRoomTaskDetail(
  supabase: SupabaseClient<Database>,
  taskId: string
) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "*, rooms(id, name, room_type_id, room_types(name)), cleaning_activities(name, status, scheduled_date, window_start, window_end, floors(floor_name, buildings(name)))"
    )
    .eq("id", taskId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get a room task for inspection with assigned user info.
 */
export async function getRoomTaskForInspection(
  supabase: SupabaseClient<Database>,
  taskId: string
) {
  const { data, error } = await supabase
    .from("room_tasks")
    .select(
      "*, rooms(id, name, room_type_id, room_types(name)), cleaning_activities(id, name, status, scheduled_date, window_start, window_end, floors(floor_name, buildings(name))), users!room_tasks_assigned_to_fkey(id, first_name, last_name)"
    )
    .eq("id", taskId)
    .single()

  if (error) throw error
  return data
}
