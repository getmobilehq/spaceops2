"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/types"
import {
  createActivityTemplateSchema,
  updateActivityTemplateSchema,
  deleteActivityTemplateSchema,
  saveActivityAsTemplateSchema,
  toggleRecurringSchema,
  generateActivitiesSchema,
  type CreateActivityTemplateInput,
  type UpdateActivityTemplateInput,
  type DeleteActivityTemplateInput,
  type SaveActivityAsTemplateInput,
  type ToggleRecurringInput,
  type GenerateActivitiesInput,
  type TimeSlot,
} from "@/lib/validations/activity-template"

type ActionResult = { success: true } | { success: false; error: string }
type ActionResultWithId =
  | { success: true; id: string }
  | { success: false; error: string }

async function getSupervisorContext() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const role = user.app_metadata?.role as string | undefined
  const orgId = user.app_metadata?.org_id as string | undefined

  if (!orgId || (role !== "admin" && role !== "supervisor")) return null

  return { user, orgId, supabase }
}

export async function createActivityTemplate(
  input: CreateActivityTemplateInput
): Promise<ActionResultWithId> {
  const parsed = createActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { data, error } = await ctx.supabase
    .from("activity_templates")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.user.id,
      name: parsed.data.name,
      floor_id: parsed.data.floorId,
      window_start: parsed.data.windowStart,
      window_end: parsed.data.windowEnd,
      notes: parsed.data.notes ?? null,
      default_assignments: parsed.data.defaultAssignments as unknown as Json,
      is_recurring: parsed.data.isRecurring,
      recurrence_days: parsed.data.recurrenceDays,
      time_slots: parsed.data.timeSlots as unknown as Json,
      recurrence_preset: parsed.data.recurrencePreset,
      is_active: true,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to create template" }
  return { success: true, id: data.id }
}

export async function updateActivityTemplate(
  input: UpdateActivityTemplateInput
): Promise<ActionResult> {
  const parsed = updateActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name
  if (parsed.data.windowStart !== undefined)
    updateData.window_start = parsed.data.windowStart
  if (parsed.data.windowEnd !== undefined)
    updateData.window_end = parsed.data.windowEnd
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
  if (parsed.data.defaultAssignments !== undefined)
    updateData.default_assignments = parsed.data.defaultAssignments
  if (parsed.data.isRecurring !== undefined) {
    updateData.is_recurring = parsed.data.isRecurring
    if (!parsed.data.isRecurring) {
      updateData.recurrence_days = []
      updateData.time_slots = []
      updateData.recurrence_preset = null
    }
  }
  if (parsed.data.recurrenceDays !== undefined)
    updateData.recurrence_days = parsed.data.recurrenceDays
  if (parsed.data.timeSlots !== undefined)
    updateData.time_slots = parsed.data.timeSlots
  if (parsed.data.recurrencePreset !== undefined)
    updateData.recurrence_preset = parsed.data.recurrencePreset

  const { error } = await ctx.supabase
    .from("activity_templates")
    .update(updateData)
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to update template" }
  return { success: true }
}

export async function deleteActivityTemplate(
  input: DeleteActivityTemplateInput
): Promise<ActionResult> {
  const parsed = deleteActivityTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("activity_templates")
    .delete()
    .eq("id", parsed.data.templateId)

  if (error) return { success: false, error: "Failed to delete template" }
  return { success: true }
}

export async function saveActivityAsTemplate(
  input: SaveActivityAsTemplateInput
): Promise<ActionResultWithId> {
  const parsed = saveActivityAsTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  // Fetch activity with room tasks
  const { data: activity, error: fetchError } = await ctx.supabase
    .from("cleaning_activities")
    .select("floor_id, window_start, window_end, notes, room_tasks(room_id, assigned_to)")
    .eq("id", parsed.data.activityId)
    .single()

  if (fetchError || !activity) {
    return { success: false, error: "Activity not found" }
  }

  // Build default assignments from current room task assignments
  const defaultAssignments = (activity.room_tasks || [])
    .filter((t: { assigned_to: string | null }) => t.assigned_to)
    .map((t: { room_id: string; assigned_to: string | null }) => ({
      room_id: t.room_id,
      assigned_to: t.assigned_to,
    }))

  const { data, error } = await ctx.supabase
    .from("activity_templates")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.user.id,
      name: parsed.data.name,
      floor_id: activity.floor_id,
      window_start: activity.window_start,
      window_end: activity.window_end,
      notes: activity.notes,
      default_assignments: defaultAssignments,
    })
    .select("id")
    .single()

  if (error) return { success: false, error: "Failed to save as template" }
  return { success: true, id: data.id }
}

export async function toggleRecurringActive(
  input: ToggleRecurringInput
): Promise<ActionResult> {
  const parsed = toggleRecurringSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const ctx = await getSupervisorContext()
  if (!ctx) return { success: false, error: "Unauthorized" }

  const { error } = await ctx.supabase
    .from("activity_templates")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.templateId)
    .eq("is_recurring", true)

  if (error) return { success: false, error: "Failed to update schedule" }
  return { success: true }
}

// --- Recurring activity generation ---

function getDayName(dateStr: string): string {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ]
  return days[new Date(dateStr + "T12:00:00Z").getUTCDay()]
}

function buildActivityName(
  templateName: string,
  slot: TimeSlot,
  index: number,
  total: number
): string {
  if (total === 1) return templateName
  const labels = ["Morning", "Afternoon", "Evening"]
  const suffix = slot.label || labels[index] || `Slot ${index + 1}`
  return `${templateName} (${suffix})`
}

export async function generateRecurringActivities(
  input?: GenerateActivitiesInput
): Promise<{ success: true; created: number } | { success: false; error: string }> {
  const parsed = generateActivitiesSchema.safeParse(input || {})
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = createAdminClient()
  const targetDate =
    parsed.data?.date || new Date().toISOString().split("T")[0]
  const dayOfWeek = getDayName(targetDate)

  // 1. Query recurring templates for today's day
  let query = supabase
    .from("activity_templates")
    .select("*")
    .eq("is_recurring", true)
    .eq("is_active", true)
    .contains("recurrence_days", [dayOfWeek])

  if (parsed.data?.templateId) {
    query = query.eq("id", parsed.data.templateId)
  }

  const { data: templates, error } = await query
  if (error) return { success: false, error: "Failed to query templates" }

  let created = 0

  for (const template of templates || []) {
    const timeSlots = (template.time_slots as TimeSlot[]) || []
    const slots =
      timeSlots.length > 0
        ? timeSlots
        : [
            {
              window_start: template.window_start,
              window_end: template.window_end,
            },
          ]

    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex]

      // 2. Idempotency check
      const { data: existing } = await supabase
        .from("cleaning_activities")
        .select("id")
        .eq("source_template_id", template.id)
        .eq("scheduled_date", targetDate)
        .eq("window_start", slot.window_start)
        .eq("window_end", slot.window_end)
        .limit(1)

      if (existing && existing.length > 0) continue

      // 3. Create the activity
      const activityName = buildActivityName(
        template.name,
        slot,
        slotIndex,
        slots.length
      )

      const { data: activity, error: actErr } = await supabase
        .from("cleaning_activities")
        .insert({
          org_id: template.org_id,
          floor_id: template.floor_id,
          created_by: template.created_by,
          name: activityName,
          scheduled_date: targetDate,
          window_start: slot.window_start,
          window_end: slot.window_end,
          notes: template.notes,
          source_template_id: template.id,
          status: "draft",
        })
        .select("id")
        .single()

      if (actErr || !activity) continue

      // 4. Create room_tasks
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("floor_id", template.floor_id)
        .eq("is_active", true)

      if (rooms && rooms.length > 0) {
        const assignments = Array.isArray(template.default_assignments)
          ? (
              template.default_assignments as {
                room_id: string
                assigned_to: string
              }[]
            )
          : []
        const assignmentMap = new Map(
          assignments.map((a) => [a.room_id, a.assigned_to])
        )

        const tasks = rooms.map((room) => ({
          activity_id: activity.id,
          room_id: room.id,
          org_id: template.org_id,
          assigned_to: assignmentMap.get(room.id) || null,
        }))

        await supabase.from("room_tasks").insert(tasks)
      }

      created++
    }

    // 5. Update last_generated_date
    await supabase
      .from("activity_templates")
      .update({ last_generated_date: targetDate })
      .eq("id", template.id)
  }

  return { success: true, created }
}
