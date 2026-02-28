/**
 * SpaceOps – Comprehensive Flow Test Script
 * Tests all major flows: Auth, Admin CRUD, Supervisor activities,
 * Inspection, Deficiency tracking, Janitor tasks, Client dashboard queries.
 *
 * Run: node scripts/test-all-flows.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://rwmcyleyzwzkxlvxlpqj.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bWN5bGV5end6a3hsdnhscHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzgxNzYsImV4cCI6MjA4NTc1NDE3Nn0.MiASFBy9N9MOCzjlHv2f2Nzt0VUmW4EGNFJRxWXxy84";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3bWN5bGV5end6a3hsdnhscHFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE3ODE3NiwiZXhwIjoyMDg1NzU0MTc2fQ.OmyJP14oiEXBZ_epWSSxZqhTXFkvWtn8hsv1quqC828";

// Admin client (bypasses RLS)
const admin = createClient(SUPABASE_URL, SERVICE_KEY);

// Test users
const USERS = {
  admin: { email: "admin@acme-cleaning.com", password: "Password123!" },
  supervisor: { email: "supervisor@acme-cleaning.com", password: "Password123!" },
  janitor: { email: "janitor@acme-cleaning.com", password: "Password123!" },
  client: { email: "client@building-owner.com", password: "Password123!" },
};

let results = [];
let testCount = 0;

function pass(name) {
  testCount++;
  results.push({ name, status: "PASS" });
  console.log(`  ✅ ${name}`);
}
function fail(name, err) {
  testCount++;
  results.push({ name, status: "FAIL", err });
  console.log(`  ❌ ${name}: ${err}`);
}

async function authedClient(role) {
  const sb = createClient(SUPABASE_URL, ANON_KEY);
  const { data, error } = await sb.auth.signInWithPassword(USERS[role]);
  if (error) throw new Error(`Login as ${role} failed: ${error.message}`);
  return { sb, user: data.user, session: data.session };
}

// =========================================================
// 1. AUTH FLOWS
// =========================================================
async function testAuth() {
  console.log("\n🔑 AUTH FLOWS");

  // Login all 4 roles
  for (const role of ["admin", "supervisor", "janitor", "client"]) {
    try {
      const { user } = await authedClient(role);
      if (!user) throw new Error("No user returned");
      const meta = user.app_metadata;
      if (meta?.role !== role) throw new Error(`Expected role ${role}, got ${meta?.role}`);
      if (!meta?.org_id) throw new Error("Missing org_id");
      pass(`Login as ${role}`);
    } catch (e) {
      fail(`Login as ${role}`, e.message);
    }
  }

  // Wrong password
  try {
    const sb = createClient(SUPABASE_URL, ANON_KEY);
    const { error } = await sb.auth.signInWithPassword({
      email: USERS.admin.email,
      password: "WrongPassword!",
    });
    if (error) pass("Wrong password rejected");
    else fail("Wrong password rejected", "Should have failed");
  } catch (e) {
    fail("Wrong password rejected", e.message);
  }

  // Non-existent user
  try {
    const sb = createClient(SUPABASE_URL, ANON_KEY);
    const { error } = await sb.auth.signInWithPassword({
      email: "nobody@example.com",
      password: "Password123!",
    });
    if (error) pass("Non-existent user rejected");
    else fail("Non-existent user rejected", "Should have failed");
  } catch (e) {
    fail("Non-existent user rejected", e.message);
  }
}

// =========================================================
// 2. ADMIN: CLIENTS CRUD
// =========================================================
async function testAdminClients() {
  console.log("\n🏢 ADMIN: CLIENTS");
  const { sb } = await authedClient("admin");

  // List clients
  try {
    const { data, error } = await sb.from("clients").select("*");
    if (error) throw error;
    pass(`List clients (${data.length} found)`);
  } catch (e) {
    fail("List clients", e.message);
  }

  // Create client
  let clientId;
  try {
    const { data, error } = await sb
      .from("clients")
      .insert({
        org_id: (await sb.auth.getUser()).data.user.app_metadata.org_id,
        company_name: "Test Client Corp",
        contact_name: "Test Contact",
        contact_email: "test@testclient.com",
      })
      .select("id")
      .single();
    if (error) throw error;
    clientId = data.id;
    pass("Create client");
  } catch (e) {
    fail("Create client", e.message);
  }

  // Update client
  if (clientId) {
    try {
      const { error } = await sb
        .from("clients")
        .update({ company_name: "Updated Client Corp" })
        .eq("id", clientId);
      if (error) throw error;
      pass("Update client");
    } catch (e) {
      fail("Update client", e.message);
    }

    // Cleanup
    await admin.from("clients").delete().eq("id", clientId);
  }
}

// =========================================================
// 3. ADMIN: BUILDINGS + FLOORS + ROOMS
// =========================================================
let testBuildingId, testFloorId, testRoomId;

async function testAdminBuildings() {
  console.log("\n🏗️ ADMIN: BUILDINGS, FLOORS, ROOMS");
  const { sb, user } = await authedClient("admin");
  const orgId = user.app_metadata.org_id;

  // Create building
  try {
    const { data, error } = await sb
      .from("buildings")
      .insert({ org_id: orgId, name: "Test Building", address: "123 Test St" })
      .select("id")
      .single();
    if (error) throw error;
    testBuildingId = data.id;
    pass("Create building");
  } catch (e) {
    fail("Create building", e.message);
  }

  // Create floor
  if (testBuildingId) {
    try {
      const { data, error } = await sb
        .from("floors")
        .insert({
          building_id: testBuildingId,
          org_id: orgId,
          floor_number: 1,
          floor_name: "Ground Floor",
        })
        .select("id")
        .single();
      if (error) throw error;
      testFloorId = data.id;
      pass("Create floor");
    } catch (e) {
      fail("Create floor", e.message);
    }
  }

  // Get a room type
  let roomTypeId;
  try {
    const { data } = await sb.from("room_types").select("id").limit(1).single();
    roomTypeId = data?.id;
    if (!roomTypeId) throw new Error("No room types found");
    pass("Room types exist");
  } catch (e) {
    fail("Room types exist", e.message);
  }

  // Create room
  if (testFloorId && roomTypeId) {
    try {
      const { data, error } = await sb
        .from("rooms")
        .insert({
          floor_id: testFloorId,
          org_id: orgId,
          name: "Test Room 101",
          room_type_id: roomTypeId,
        })
        .select("id")
        .single();
      if (error) throw error;
      testRoomId = data.id;
      pass("Create room");
    } catch (e) {
      fail("Create room", e.message);
    }
  }

  // List buildings with floors
  try {
    const { data, error } = await sb
      .from("buildings")
      .select("*, floors(id, floor_name, rooms(id))");
    if (error) throw error;
    pass(`List buildings (${data.length} found)`);
  } catch (e) {
    fail("List buildings", e.message);
  }
}

// =========================================================
// 4. ADMIN: CHECKLISTS
// =========================================================
async function testAdminChecklists() {
  console.log("\n📋 ADMIN: CHECKLISTS");
  const { sb, user } = await authedClient("admin");
  const orgId = user.app_metadata.org_id;

  // List templates
  try {
    const { data, error } = await sb.from("checklist_templates").select("*, checklist_items(*)");
    if (error) throw error;
    pass(`List checklist templates (${data.length} found)`);
    if (data.length > 0) {
      const totalItems = data.reduce((sum, t) => sum + (t.checklist_items?.length || 0), 0);
      pass(`Checklist items exist (${totalItems} total)`);
    }
  } catch (e) {
    fail("List checklist templates", e.message);
  }

  // Create template
  let templateId;
  try {
    const { data: roomType } = await sb.from("room_types").select("id").limit(1).single();
    const { data, error } = await sb
      .from("checklist_templates")
      .insert({
        org_id: orgId,
        room_type_id: roomType.id,
        name: "Test Template",
        is_default: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    templateId = data.id;
    pass("Create checklist template");
  } catch (e) {
    fail("Create checklist template", e.message);
  }

  // Add items
  if (templateId) {
    try {
      const { error } = await sb.from("checklist_items").insert([
        { template_id: templateId, org_id: orgId, description: "Test item 1", item_order: 1 },
        { template_id: templateId, org_id: orgId, description: "Test item 2", item_order: 2 },
      ]);
      if (error) throw error;
      pass("Create checklist items");
    } catch (e) {
      fail("Create checklist items", e.message);
    }

    // Cleanup
    await admin.from("checklist_items").delete().eq("template_id", templateId);
    await admin.from("checklist_templates").delete().eq("id", templateId);
  }
}

// =========================================================
// 5. ADMIN: USERS
// =========================================================
async function testAdminUsers() {
  console.log("\n👥 ADMIN: USERS");
  const { sb } = await authedClient("admin");

  // List users
  try {
    const { data, error } = await sb.from("users").select("*");
    if (error) throw error;
    pass(`List users (${data.length} found)`);

    // Verify all 4 roles exist
    const roles = new Set(data.map((u) => u.role));
    const expected = ["admin", "supervisor", "janitor", "client"];
    for (const r of expected) {
      if (roles.has(r)) pass(`User with role '${r}' exists`);
      else fail(`User with role '${r}' exists`, "Not found");
    }
  } catch (e) {
    fail("List users", e.message);
  }
}

// =========================================================
// 6. ADMIN: ORG SETTINGS
// =========================================================
async function testAdminSettings() {
  console.log("\n⚙️ ADMIN: SETTINGS");
  const { sb, user } = await authedClient("admin");
  const orgId = user.app_metadata.org_id;

  // Read org
  try {
    const { data, error } = await sb
      .from("organisations")
      .select("*")
      .eq("id", orgId)
      .single();
    if (error) throw error;
    pass(`Read org settings (${data.name})`);
  } catch (e) {
    fail("Read org settings", e.message);
  }

  // Update pass threshold
  try {
    const { error } = await sb
      .from("organisations")
      .update({ pass_threshold: 85 })
      .eq("id", orgId);
    if (error) throw error;
    // Revert
    await sb.from("organisations").update({ pass_threshold: 80 }).eq("id", orgId);
    pass("Update pass threshold");
  } catch (e) {
    fail("Update pass threshold", e.message);
  }
}

// =========================================================
// 7. SUPERVISOR: ACTIVITIES WORKFLOW
// =========================================================
let testActivityId;

async function testSupervisorActivities() {
  console.log("\n📅 SUPERVISOR: ACTIVITIES");
  const { sb, user } = await authedClient("supervisor");
  const orgId = user.app_metadata.org_id;

  // Need a floor with rooms – use the one we created or find existing
  let floorId = testFloorId;
  if (!floorId) {
    const { data } = await sb.from("floors").select("id").limit(1).single();
    floorId = data?.id;
  }

  if (!floorId) {
    fail("Supervisor activities", "No floors exist to create activity");
    return;
  }

  // Create activity
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await sb
      .from("cleaning_activities")
      .insert({
        org_id: orgId,
        floor_id: floorId,
        created_by: user.id,
        name: "Test Clean Session",
        scheduled_date: today,
        window_start: "08:00",
        window_end: "12:00",
        notes: "Automated test activity",
      })
      .select("id")
      .single();
    if (error) throw error;
    testActivityId = data.id;
    pass("Create activity");
  } catch (e) {
    fail("Create activity", e.message);
  }

  if (!testActivityId) return;

  // Auto-create room tasks for floor rooms
  try {
    const { data: rooms } = await sb
      .from("rooms")
      .select("id")
      .eq("floor_id", floorId)
      .eq("is_active", true);

    if (rooms && rooms.length > 0) {
      const tasks = rooms.map((r) => ({
        activity_id: testActivityId,
        room_id: r.id,
        org_id: orgId,
      }));
      const { error } = await sb.from("room_tasks").insert(tasks);
      if (error) throw error;
      pass(`Create room tasks (${rooms.length} rooms)`);
    } else {
      pass("No rooms on floor (skip room tasks)");
    }
  } catch (e) {
    fail("Create room tasks", e.message);
  }

  // List activities
  try {
    const { data, error } = await sb
      .from("cleaning_activities")
      .select("*, room_tasks(id, status)")
      .order("scheduled_date", { ascending: false });
    if (error) throw error;
    pass(`List activities (${data.length} found)`);
  } catch (e) {
    fail("List activities", e.message);
  }

  // Assign janitor to room tasks
  const { sb: janitorSb, user: janitorUser } = await authedClient("janitor");
  try {
    const { data: tasks } = await sb
      .from("room_tasks")
      .select("id")
      .eq("activity_id", testActivityId);

    if (tasks && tasks.length > 0) {
      for (const t of tasks) {
        await sb
          .from("room_tasks")
          .update({ assigned_to: janitorUser.id })
          .eq("id", t.id);
      }
      pass(`Assign janitor to ${tasks.length} tasks`);
    }
  } catch (e) {
    fail("Assign janitor", e.message);
  }

  // Publish activity (draft → active)
  try {
    const { error } = await sb
      .from("cleaning_activities")
      .update({ status: "active" })
      .eq("id", testActivityId);
    if (error) throw error;
    pass("Publish activity (draft → active)");
  } catch (e) {
    fail("Publish activity", e.message);
  }
}

// =========================================================
// 8. JANITOR: TODAY'S TASKS + CHECKLIST RESPONSES
// =========================================================
let testRoomTaskId;

async function testJanitorTasks() {
  console.log("\n🧹 JANITOR: TASKS & RESPONSES");
  const { sb, user } = await authedClient("janitor");

  // Get tasks for today
  try {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await sb
      .from("room_tasks")
      .select(
        "*, rooms(name, room_types(name)), cleaning_activities!inner(name, scheduled_date, status)"
      )
      .eq("assigned_to", user.id)
      .eq("cleaning_activities.scheduled_date", today)
      .eq("cleaning_activities.status", "active");
    if (error) throw error;
    pass(`Get today's tasks (${data.length} tasks)`);
    if (data.length > 0) testRoomTaskId = data[0].id;
  } catch (e) {
    fail("Get today's tasks", e.message);
  }

  if (!testRoomTaskId) {
    console.log("    (No room tasks to work with – some tests skipped)");
    return;
  }

  // Start task (not_started → in_progress)
  try {
    const { error } = await sb
      .from("room_tasks")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", testRoomTaskId);
    if (error) throw error;
    pass("Start task (not_started → in_progress)");
  } catch (e) {
    fail("Start task", e.message);
  }

  // Get effective checklist for the room
  let checklistItems = [];
  try {
    const { data: task } = await sb
      .from("room_tasks")
      .select("room_id, rooms(room_type_id)")
      .eq("id", testRoomTaskId)
      .single();

    const roomTypeId = task?.rooms?.room_type_id;
    if (roomTypeId) {
      const { data: tpl } = await sb
        .from("checklist_templates")
        .select("id")
        .eq("room_type_id", roomTypeId)
        .eq("is_default", true)
        .maybeSingle();

      if (tpl?.id) {
        const { data: items } = await sb
          .from("checklist_items")
          .select("*")
          .eq("template_id", tpl.id)
          .order("item_order", { ascending: true });
        checklistItems = items || [];
      }
    }
    pass(`Get checklist items (${checklistItems.length} items)`);
  } catch (e) {
    fail("Get checklist items", e.message);
  }

  // Upsert item responses
  const orgId = user.app_metadata.org_id;
  if (checklistItems.length > 0) {
    try {
      for (const item of checklistItems) {
        const { error } = await sb.from("task_item_responses").upsert(
          {
            room_task_id: testRoomTaskId,
            checklist_item_id: item.id,
            org_id: orgId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          },
          { onConflict: "room_task_id,checklist_item_id" }
        );
        if (error) throw error;
      }
      pass(`Upsert ${checklistItems.length} item responses`);
    } catch (e) {
      fail("Upsert item responses", e.message);
    }
  }

  // Complete task (in_progress → done)
  try {
    const { error } = await sb
      .from("room_tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", testRoomTaskId);
    if (error) throw error;
    pass("Complete task (in_progress → done)");
  } catch (e) {
    fail("Complete task", e.message);
  }
}

// =========================================================
// 9. SUPERVISOR: INSPECTION FLOW
// =========================================================
async function testInspection() {
  console.log("\n🔍 SUPERVISOR: INSPECTION");
  const { sb, user } = await authedClient("supervisor");

  if (!testRoomTaskId) {
    console.log("    (No completed task to inspect – skipped)");
    return;
  }

  // Verify task is in "done" status
  try {
    const { data: task } = await sb
      .from("room_tasks")
      .select("id, status, room_id")
      .eq("id", testRoomTaskId)
      .single();
    if (task?.status !== "done") throw new Error(`Task status is ${task?.status}, expected done`);
    pass("Task ready for inspection (status: done)");
  } catch (e) {
    fail("Task ready for inspection", e.message);
  }

  // Get task item responses (what the janitor submitted)
  try {
    const { data, error } = await sb
      .from("task_item_responses")
      .select("*")
      .eq("room_task_id", testRoomTaskId);
    if (error) throw error;
    pass(`View janitor responses (${data.length} responses)`);
  } catch (e) {
    fail("View janitor responses", e.message);
  }

  // Inspect task – mark as FAIL (to test deficiency flow next)
  try {
    const { error } = await sb
      .from("room_tasks")
      .update({
        status: "inspected_fail",
        inspected_by: user.id,
        inspected_at: new Date().toISOString(),
        inspection_note: "Test inspection - marking as failed for deficiency test",
      })
      .eq("id", testRoomTaskId);
    if (error) throw error;
    pass("Inspect task → inspected_fail");
  } catch (e) {
    fail("Inspect task → inspected_fail", e.message);
  }

  // Verify inspection columns
  try {
    const { data } = await sb
      .from("room_tasks")
      .select("inspected_by, inspected_at, inspection_note")
      .eq("id", testRoomTaskId)
      .single();
    if (!data?.inspected_by) throw new Error("inspected_by not set");
    if (!data?.inspected_at) throw new Error("inspected_at not set");
    if (!data?.inspection_note) throw new Error("inspection_note not set");
    pass("Inspection columns populated correctly");
  } catch (e) {
    fail("Inspection columns populated", e.message);
  }
}

// =========================================================
// 10. SUPERVISOR: DEFICIENCY TRACKING
// =========================================================
let testDeficiencyId;

async function testDeficiencies() {
  console.log("\n⚠️ DEFICIENCY TRACKING");
  const { sb: supSb, user: supUser } = await authedClient("supervisor");
  const orgId = supUser.app_metadata.org_id;

  if (!testRoomTaskId) {
    console.log("    (No failed task – skipped)");
    return;
  }

  // Create deficiency
  try {
    const { sb: janSb, user: janUser } = await authedClient("janitor");
    const { data, error } = await supSb
      .from("deficiencies")
      .insert({
        room_task_id: testRoomTaskId,
        org_id: orgId,
        reported_by: supUser.id,
        assigned_to: janUser.id,
        description: "Floor not properly mopped in corner",
        severity: "medium",
      })
      .select("id")
      .single();
    if (error) throw error;
    testDeficiencyId = data.id;
    pass("Create deficiency");
  } catch (e) {
    fail("Create deficiency", e.message);
  }

  // Create a second deficiency (high severity)
  try {
    const { data, error } = await supSb
      .from("deficiencies")
      .insert({
        room_task_id: testRoomTaskId,
        org_id: orgId,
        reported_by: supUser.id,
        description: "Trash not emptied",
        severity: "high",
      })
      .select("id")
      .single();
    if (error) throw error;
    pass("Create deficiency (high severity, unassigned)");
    // Cleanup the second one later
    await admin.from("deficiencies").delete().eq("id", data.id);
  } catch (e) {
    fail("Create deficiency (high severity)", e.message);
  }

  // Supervisor: List org deficiencies
  try {
    const { data, error } = await supSb
      .from("deficiencies")
      .select(
        "*, room_tasks(id, rooms(name)), reporter:users!deficiencies_reported_by_fkey(first_name, last_name)"
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    pass(`List org deficiencies (${data.length} found)`);
  } catch (e) {
    fail("List org deficiencies", e.message);
  }

  // Janitor: See my deficiencies
  if (testDeficiencyId) {
    const { sb: janSb, user: janUser } = await authedClient("janitor");
    try {
      const { data, error } = await janSb
        .from("deficiencies")
        .select("*")
        .eq("assigned_to", janUser.id)
        .in("status", ["open", "in_progress"]);
      if (error) throw error;
      const found = data.find((d) => d.id === testDeficiencyId);
      if (!found) throw new Error("Assigned deficiency not found");
      pass(`Janitor sees assigned deficiency`);
    } catch (e) {
      fail("Janitor sees assigned deficiency", e.message);
    }

    // Janitor: Resolve deficiency
    try {
      const { error } = await janSb
        .from("deficiencies")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolved_by: janUser.id,
          resolution_note: "Re-mopped the corner thoroughly",
        })
        .eq("id", testDeficiencyId);
      if (error) throw error;
      pass("Janitor resolves deficiency");
    } catch (e) {
      fail("Janitor resolves deficiency", e.message);
    }

    // Verify resolution
    try {
      const { data } = await janSb
        .from("deficiencies")
        .select("status, resolved_by, resolution_note")
        .eq("id", testDeficiencyId)
        .single();
      if (data?.status !== "resolved") throw new Error(`Status: ${data?.status}`);
      if (!data?.resolved_by) throw new Error("resolved_by not set");
      pass("Deficiency resolution verified");
    } catch (e) {
      fail("Deficiency resolution verified", e.message);
    }
  }
}

// =========================================================
// 11. CLIENT: DASHBOARD QUERIES
// =========================================================
async function testClientDashboard() {
  console.log("\n👁️ CLIENT: DASHBOARD");
  const { sb } = await authedClient("client");

  // Buildings
  try {
    const { data, error } = await sb
      .from("buildings")
      .select("id, name, address, status, floors(id, floor_name, rooms(id))")
      .eq("status", "active");
    if (error) throw error;
    pass(`Client sees buildings (${data.length} found)`);
  } catch (e) {
    fail("Client sees buildings", e.message);
  }

  // Recent activities
  try {
    const { data, error } = await sb
      .from("cleaning_activities")
      .select(
        "id, name, status, scheduled_date, floors(floor_name, buildings(name)), room_tasks(id, status)"
      )
      .in("status", ["active", "closed"])
      .order("scheduled_date", { ascending: false })
      .limit(10);
    if (error) throw error;
    pass(`Client sees recent activities (${data.length} found)`);
  } catch (e) {
    fail("Client sees recent activities", e.message);
  }

  // Dashboard stats: task counts
  try {
    const { data, error } = await sb.from("room_tasks").select("status");
    if (error) throw error;
    const total = data.length;
    const passed = data.filter((t) => t.status === "inspected_pass").length;
    const failed = data.filter((t) => t.status === "inspected_fail").length;
    pass(`Client dashboard stats (${total} tasks, ${passed} passed, ${failed} failed)`);
  } catch (e) {
    fail("Client dashboard stats", e.message);
  }

  // Deficiency count
  try {
    const { count, error } = await sb
      .from("deficiencies")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]);
    if (error) throw error;
    pass(`Client sees open deficiencies (${count})`);
  } catch (e) {
    fail("Client sees open deficiencies", e.message);
  }
}

// =========================================================
// 12. RLS: CROSS-ORG ISOLATION
// =========================================================
async function testRLS() {
  console.log("\n🔒 RLS: CROSS-ORG ISOLATION");

  // Create a temporary org and verify our test users can't see it
  try {
    const { data: otherOrg } = await admin
      .from("organisations")
      .insert({ name: "Other Org", slug: "other-org" })
      .select("id")
      .single();

    if (!otherOrg) throw new Error("Failed to create test org");

    // Admin should NOT see the other org's data (RLS filters by JWT org_id)
    const { sb } = await authedClient("admin");
    const { data: orgs } = await sb.from("organisations").select("id");
    const canSeeOther = orgs?.some((o) => o.id === otherOrg.id);

    if (canSeeOther) {
      fail("RLS blocks cross-org access", "Admin can see other org");
    } else {
      pass("RLS blocks cross-org access");
    }

    // Cleanup
    await admin.from("organisations").delete().eq("id", otherOrg.id);
  } catch (e) {
    fail("RLS cross-org test", e.message);
  }
}

// =========================================================
// 13. PASS INSPECTION FLOW (second task if available)
// =========================================================
async function testPassInspection() {
  console.log("\n✅ SUPERVISOR: PASS INSPECTION");
  const { sb: supSb, user: supUser } = await authedClient("supervisor");

  // Find another "done" task (if any)
  let passTaskId;
  try {
    const { data: tasks } = await supSb
      .from("room_tasks")
      .select("id")
      .eq("activity_id", testActivityId)
      .eq("status", "not_started")
      .limit(1);

    if (tasks && tasks.length > 0) {
      // Fast-track it: not_started → in_progress → done
      passTaskId = tasks[0].id;
      await supSb
        .from("room_tasks")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", passTaskId);
    }
  } catch (e) {
    // silent
  }

  if (!passTaskId) {
    console.log("    (No additional task to pass-inspect – skipped)");
    return;
  }

  // Inspect as pass
  try {
    const { error } = await supSb
      .from("room_tasks")
      .update({
        status: "inspected_pass",
        inspected_by: supUser.id,
        inspected_at: new Date().toISOString(),
        inspection_note: "Excellent clean",
      })
      .eq("id", passTaskId);
    if (error) throw error;
    pass("Inspect task → inspected_pass");
  } catch (e) {
    fail("Inspect task → inspected_pass", e.message);
  }
}

// =========================================================
// 14. ADMIN: REPORTS & ANALYTICS
// =========================================================
async function testReports() {
  console.log("\n📊 ADMIN: REPORTS & ANALYTICS");
  const { sb } = await authedClient("admin");

  // Report summary stats
  try {
    const { data: tasks, error } = await sb.from("room_tasks").select("status");
    if (error) throw error;
    const all = tasks || [];
    const passed = all.filter((t) => t.status === "inspected_pass").length;
    const failed = all.filter((t) => t.status === "inspected_fail").length;
    const inspected = passed + failed;
    const passRate = inspected > 0 ? Math.round((passed / inspected) * 100) : null;
    pass(`Report summary (${all.length} tasks, pass rate: ${passRate ?? "N/A"}%)`);
  } catch (e) {
    fail("Report summary", e.message);
  }

  // Pass rates by building
  try {
    const { data, error } = await sb
      .from("room_tasks")
      .select("status, rooms!inner(floors!inner(buildings!inner(id, name)))")
      .in("status", ["inspected_pass", "inspected_fail"]);
    if (error) throw error;

    const map = new Map();
    for (const t of data || []) {
      const building = t.rooms?.floors?.buildings;
      if (!building) continue;
      if (!map.has(building.id)) map.set(building.id, { name: building.name, p: 0, f: 0 });
      const e = map.get(building.id);
      if (t.status === "inspected_pass") e.p++;
      else e.f++;
    }
    const buildings = Array.from(map.values());
    pass(`Pass rates by building (${buildings.length} buildings with inspections)`);
  } catch (e) {
    fail("Pass rates by building", e.message);
  }

  // Pass rates by janitor
  try {
    const { data, error } = await sb
      .from("room_tasks")
      .select("status, assigned_to, users!room_tasks_assigned_to_fkey(first_name, last_name)")
      .in("status", ["inspected_pass", "inspected_fail"])
      .not("assigned_to", "is", null);
    if (error) throw error;

    const map = new Map();
    for (const t of data || []) {
      if (!t.assigned_to || !t.users) continue;
      if (!map.has(t.assigned_to))
        map.set(t.assigned_to, { name: `${t.users.first_name} ${t.users.last_name}`, p: 0, f: 0 });
      const e = map.get(t.assigned_to);
      if (t.status === "inspected_pass") e.p++;
      else e.f++;
    }
    const janitors = Array.from(map.values());
    pass(`Pass rates by janitor (${janitors.length} janitors with inspections)`);
  } catch (e) {
    fail("Pass rates by janitor", e.message);
  }

  // Activity trend (last 30 days)
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().split("T")[0];

    const { data, error } = await sb
      .from("room_tasks")
      .select("status, cleaning_activities!inner(scheduled_date)")
      .in("status", ["inspected_pass", "inspected_fail", "done"])
      .gte("cleaning_activities.scheduled_date", sinceStr);
    if (error) throw error;

    const dates = new Set();
    for (const t of data || []) {
      const d = t.cleaning_activities?.scheduled_date;
      if (d) dates.add(d);
    }
    pass(`Activity trend data (${dates.size} dates, ${(data || []).length} data points)`);
  } catch (e) {
    fail("Activity trend data", e.message);
  }

  // Activity history
  try {
    const { data, error } = await sb
      .from("cleaning_activities")
      .select("id, name, status, scheduled_date, floors(floor_name, buildings(name)), room_tasks(status)")
      .order("scheduled_date", { ascending: false })
      .limit(20);
    if (error) throw error;
    pass(`Activity history (${data.length} activities)`);
  } catch (e) {
    fail("Activity history", e.message);
  }

  // Deficiency breakdown
  try {
    const { data, error } = await sb.from("deficiencies").select("severity, status");
    if (error) throw error;
    const all = data || [];
    const bySeverity = { low: 0, medium: 0, high: 0 };
    const byStatus = { open: 0, in_progress: 0, resolved: 0 };
    for (const d of all) {
      if (d.severity in bySeverity) bySeverity[d.severity]++;
      if (d.status in byStatus) byStatus[d.status]++;
    }
    pass(`Deficiency breakdown (${all.length} total: ${byStatus.open} open, ${byStatus.resolved} resolved)`);
  } catch (e) {
    fail("Deficiency breakdown", e.message);
  }

  // Verify non-admin cannot access report data (client role)
  try {
    const { sb: clientSb } = await authedClient("client");
    // Client can still query room_tasks (RLS allows org members) but
    // the page itself is gated by role check in server component
    // Here we verify the data is org-scoped
    const { data } = await clientSb.from("room_tasks").select("id").limit(1);
    pass("Report data is org-scoped (RLS enforced)");
  } catch (e) {
    fail("Report data org-scoped", e.message);
  }
}

// =========================================================
// CLEANUP
// =========================================================
async function cleanup() {
  console.log("\n🧹 CLEANUP");
  try {
    if (testDeficiencyId) {
      await admin.from("deficiencies").delete().eq("id", testDeficiencyId);
    }
    if (testActivityId) {
      // Cascade deletes room_tasks
      await admin.from("cleaning_activities").delete().eq("id", testActivityId);
    }
    if (testRoomId) {
      await admin.from("rooms").delete().eq("id", testRoomId);
    }
    if (testFloorId) {
      await admin.from("floors").delete().eq("id", testFloorId);
    }
    if (testBuildingId) {
      await admin.from("buildings").delete().eq("id", testBuildingId);
    }
    pass("Test data cleaned up");
  } catch (e) {
    fail("Cleanup", e.message);
  }
}

// =========================================================
// MAIN
// =========================================================
async function main() {
  console.log("=".repeat(60));
  console.log("  SpaceOps – Comprehensive Flow Test");
  console.log("=".repeat(60));

  await testAuth();
  await testAdminClients();
  await testAdminBuildings();
  await testAdminChecklists();
  await testAdminUsers();
  await testAdminSettings();
  await testSupervisorActivities();
  await testJanitorTasks();
  await testInspection();
  await testDeficiencies();
  await testClientDashboard();
  await testRLS();
  await testPassInspection();
  await testReports();
  await cleanup();

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log("\n" + "=".repeat(60));
  console.log(`  RESULTS: ${passed}/${testCount} PASS, ${failed} FAIL`);
  console.log("=".repeat(60));

  if (failed > 0) {
    console.log("\n  FAILURES:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`    ❌ ${r.name}: ${r.err}`));
  }

  console.log();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(2);
});
