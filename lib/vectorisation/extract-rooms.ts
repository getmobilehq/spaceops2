import { getClaudeClient } from "@/lib/claude"
import {
  extractionResultSchema,
  type ExtractionResult,
} from "@/lib/validations/vectorisation"
import { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

const EXTRACTION_MODEL = "claude-sonnet-4-6"

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. Your job is to identify all rooms, spaces, and areas in a floor plan image.

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
- Be thorough — missing rooms is worse than including questionable ones.`

export async function extractRoomsFromFloorPlan(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<ExtractionResult> {
  // 1. Download the image from Supabase storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("floor-plans")
    .download(storagePath)

  if (downloadError || !fileData) {
    throw new Error(
      `Failed to download floor plan: ${downloadError?.message}`
    )
  }

  // 2. Convert to base64
  const arrayBuffer = await fileData.arrayBuffer()
  const base64Data = Buffer.from(arrayBuffer).toString("base64")

  // 3. Determine media type and content block type from file extension
  const ext = storagePath.split(".").pop()?.toLowerCase() || "png"
  const isPdf = ext === "pdf"

  const imageMediaTypeMap: Record<string, "image/jpeg" | "image/png" | "image/webp" | "image/gif"> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  }

  if (!isPdf && !imageMediaTypeMap[ext]) {
    throw new Error(
      `Unsupported format: .${ext}. Please upload a JPEG, PNG, WebP, or PDF file.`
    )
  }

  // 4. Build the content block — PDF uses "document" type, images use "image" type
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

  const fileContentBlock = isPdf
    ? {
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: base64Data,
        },
      }
    : {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: imageMediaTypeMap[ext],
          data: base64Data,
        },
      }

  // 5. Call Claude Vision
  const client = getClaudeClient()

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
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

  // 6. Parse response
  const textBlock = response.content.find((b) => b.type === "text")
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response")
  }

  // Strip any accidental markdown fencing
  let jsonText = textBlock.text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON: ${jsonText.slice(0, 200)}`
    )
  }

  // 7. Add tempIds and validate with Zod
  const rawObj = parsed as Record<string, unknown>
  const rawRooms = rawObj.rooms as Array<Record<string, unknown>>

  const withIds = {
    ...rawObj,
    version: 1,
    model: EXTRACTION_MODEL,
    rooms: rawRooms.map((r, i) => ({
      ...r,
      tempId: `extracted-${i}-${Date.now()}`,
    })),
  }

  const validated = extractionResultSchema.safeParse(withIds)
  if (!validated.success) {
    throw new Error(
      `Claude response failed validation: ${validated.error.issues
        .map((i) => i.message)
        .join(", ")}`
    )
  }

  return validated.data
}
