/**
 * Test script for floor plan vectorisation.
 * Usage: node scripts/test-vectorisation.mjs
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY in .env.local
 */

import { readFileSync } from "fs"
import { createClient } from "@supabase/supabase-js"
import Anthropic from "@anthropic-ai/sdk"

// Load env
const envPath = new URL("../.env.local", import.meta.url).pathname
const envContent = readFileSync(envPath, "utf-8")
const env = {}
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) env[match[1].trim()] = match[2].trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
const anthropicKey = env.ANTHROPIC_API_KEY

if (!supabaseUrl || !serviceKey || !anthropicKey) {
  console.error("Missing required env vars in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const anthropic = new Anthropic({ apiKey: anthropicKey })

async function main() {
  console.log("=== Floor Plan Vectorisation Test ===\n")

  // 1. Find a floor with an uploaded plan
  const { data: plans, error: planError } = await supabase
    .from("vectorised_plans")
    .select("id, floor_id, original_path, extraction_status, floors(floor_name, plan_status)")
    .order("created_at", { ascending: false })
    .limit(5)

  if (planError) {
    console.error("Error fetching plans:", planError.message)
    process.exit(1)
  }

  if (!plans || plans.length === 0) {
    console.log("No floor plans found in the database.")
    console.log("Please upload a floor plan image through the UI first.")
    process.exit(0)
  }

  console.log("Found floor plans:")
  for (const p of plans) {
    console.log(`  - Floor: ${p.floors?.floor_name || "unknown"} | Status: ${p.extraction_status} | Path: ${p.original_path}`)
  }
  console.log()

  // Pick the first plan that has an original_path
  const plan = plans.find((p) => p.original_path)
  if (!plan) {
    console.log("No plans have an uploaded image.")
    process.exit(0)
  }

  console.log(`Testing with floor: ${plan.floors?.floor_name} (${plan.floor_id})`)
  console.log(`Image path: ${plan.original_path}\n`)

  // 2. Download the image
  console.log("Downloading floor plan image...")
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("floor-plans")
    .download(plan.original_path)

  if (downloadError || !fileData) {
    console.error("Failed to download:", downloadError?.message)
    process.exit(1)
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString("base64")
  const ext = plan.original_path.split(".").pop()?.toLowerCase() || "png"
  const isPdf = ext === "pdf"
  const imageMediaTypes = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" }

  if (!isPdf && !imageMediaTypes[ext]) {
    console.error(`Unsupported format: .${ext}`)
    process.exit(1)
  }

  console.log(`File downloaded: ${(arrayBuffer.byteLength / 1024).toFixed(1)}KB (${ext})\n`)

  // 3. Build the content block — PDF uses "document" type, images use "image" type
  const fileContentBlock = isPdf
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64Data } }
    : { type: "image", source: { type: "base64", media_type: imageMediaTypes[ext], data: base64Data } }

  const userPrompt = `Analyze this floor plan and identify all rooms and spaces.

Return your response as a JSON object with this exact structure:
{
  "rooms": [
    {
      "label": "Room 101",
      "detectedType": "Office",
      "x": 25.5,
      "y": 30.2,
      "width": 15.0,
      "height": 12.0,
      "confidence": "high"
    }
  ],
  "totalDetected": 8,
  "layoutSummary": "L-shaped office floor with a central corridor..."
}

Return ONLY the JSON object, no markdown formatting or extra text.`

  console.log("Calling Claude Vision API (this may take 15-30 seconds)...")
  const startTime = Date.now()

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are an expert architectural floor plan analyzer. Your job is to identify all rooms, spaces, and areas in a floor plan image.

For each room or space you identify:
1. Read any label/text on the plan for that space. If no label exists, generate a descriptive name like "Corridor 1" or "Unlabeled Office".
2. Classify the space type into one of these categories (pick the closest): Office, Bathroom, Kitchen, Meeting Room, Lobby, Stairwell, Storage, Corridor, Reception, Server Room, Utility, Open Plan, Break Room, or Other.
3. Estimate the center position (x, y) as a percentage of the image dimensions (0 = left/top edge, 100 = right/bottom edge).
4. Estimate the width and height of the space as a percentage of the image dimensions.
5. Rate your confidence: "high" if the label is clearly readable and the space boundaries are clear, "medium" if you're inferring from context, "low" if highly uncertain.

Important guidelines:
- Include ALL identifiable spaces, even corridors, stairwells, and utility areas.
- Do NOT include structural elements that are not occupiable spaces (walls, columns, shafts).
- Positions should reflect the visual center of each space on the image.
- Width and height should approximate the visual extent of the space.
- If a space is irregularly shaped, use the bounding rectangle.
- Be thorough — missing rooms is worse than including questionable ones.`,
    messages: [
      {
        role: "user",
        content: [
          fileContentBlock,
          { type: "text", text: userPrompt },
        ],
      },
    ],
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`Claude responded in ${elapsed}s\n`)

  // 4. Parse response
  const textBlock = response.content.find((b) => b.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    console.error("No text response from Claude")
    process.exit(1)
  }

  let jsonText = textBlock.text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }

  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch (e) {
    console.error("Failed to parse JSON:", jsonText.slice(0, 300))
    process.exit(1)
  }

  // 5. Display results
  console.log(`Layout: ${parsed.layoutSummary}\n`)
  console.log(`Total rooms detected: ${parsed.totalDetected}\n`)
  console.log("Detected rooms:")
  console.log("-".repeat(80))

  for (const room of parsed.rooms) {
    const pos = `(${room.x.toFixed(1)}%, ${room.y.toFixed(1)}%)`
    const size = `${room.width.toFixed(1)}% x ${room.height.toFixed(1)}%`
    const conf = room.confidence === "high" ? "✓" : room.confidence === "medium" ? "~" : "?"
    console.log(`  ${conf} ${room.label.padEnd(25)} ${room.detectedType.padEnd(15)} pos=${pos.padEnd(18)} size=${size}`)
  }

  console.log("-".repeat(80))

  // 6. Store results in DB
  console.log("\nSaving extraction results to database...")
  const extractionResult = {
    version: 1,
    model: "claude-sonnet-4-6",
    rooms: parsed.rooms.map((r, i) => ({
      ...r,
      tempId: `extracted-${i}-${Date.now()}`,
    })),
    totalDetected: parsed.totalDetected,
    layoutSummary: parsed.layoutSummary,
  }

  const { error: updateError } = await supabase
    .from("vectorised_plans")
    .update({
      extracted_data: extractionResult,
      extraction_status: "completed",
      extraction_error: null,
      extracted_at: new Date().toISOString(),
    })
    .eq("id", plan.id)

  if (updateError) {
    console.error("Failed to save:", updateError.message)
    process.exit(1)
  }

  // Update floor status
  await supabase
    .from("floors")
    .update({ plan_status: "vectorised" })
    .eq("id", plan.floor_id)

  console.log("Saved! Floor plan status updated to 'vectorised'.")

  // 7. Check existing rooms for matching preview
  const { data: existingRooms } = await supabase
    .from("rooms")
    .select("id, name, room_types(name)")
    .eq("floor_id", plan.floor_id)

  if (existingRooms && existingRooms.length > 0) {
    console.log(`\nExisting rooms on this floor (${existingRooms.length}):`)
    for (const r of existingRooms) {
      console.log(`  - ${r.name} (${r.room_types?.name || "no type"})`)
    }
  } else {
    console.log("\nNo existing rooms on this floor yet.")
  }

  console.log("\n=== Test complete! Open the floor setup page in the browser to see the results. ===")
}

main().catch((e) => {
  console.error("Fatal error:", e)
  process.exit(1)
})
