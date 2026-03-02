interface ExistingRoom {
  id: string
  name: string
  roomTypeName: string
}

interface ExtractedRoomInput {
  tempId: string
  label: string
  detectedType: string
}

export interface MatchResult {
  tempId: string
  matchedRoomId: string | null
  matchScore: number
  matchReason: string
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  )
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^(room|rm|space)\s*#?\s*/i, "")
    .replace(/\s+/g, " ")
}

function typesMatch(detected: string, existing: string): boolean {
  const d = detected.toLowerCase()
  const e = existing.toLowerCase()
  if (d === e) return true
  if (d.includes(e) || e.includes(d)) return true
  // Common aliases
  const aliases: Record<string, string[]> = {
    bathroom: ["restroom", "toilet", "wc", "washroom", "lavatory"],
    "meeting room": ["conference", "conference room", "boardroom"],
    kitchen: ["kitchenette", "break room", "pantry"],
    lobby: ["reception", "foyer", "entrance"],
    storage: ["store", "storeroom", "closet"],
    corridor: ["hallway", "hall", "passage", "passageway"],
    office: ["workspace", "work area"],
  }
  for (const [key, vals] of Object.entries(aliases)) {
    const group = [key, ...vals]
    if (group.some((g) => d.includes(g)) && group.some((g) => e.includes(g))) {
      return true
    }
  }
  return false
}

export function matchExtractedRooms(
  extracted: ExtractedRoomInput[],
  existing: ExistingRoom[]
): MatchResult[] {
  // Calculate all potential matches with scores
  const candidates: {
    tempId: string
    roomId: string
    score: number
    reason: string
  }[] = []

  for (const ext of extracted) {
    const extNorm = normalize(ext.label)

    for (const ex of existing) {
      const exNorm = normalize(ex.name)

      // Exact name match
      if (extNorm === exNorm) {
        candidates.push({
          tempId: ext.tempId,
          roomId: ex.id,
          score: 1.0,
          reason: `Exact name match: "${ex.name}"`,
        })
        continue
      }

      // Normalized name match (low edit distance)
      const dist = levenshtein(extNorm, exNorm)
      if (dist <= 2 && Math.max(extNorm.length, exNorm.length) > 2) {
        candidates.push({
          tempId: ext.tempId,
          roomId: ex.id,
          score: 0.9,
          reason: `Similar name: "${ex.name}" (distance: ${dist})`,
        })
        continue
      }

      // Name contains + type match
      const nameOverlap =
        extNorm.includes(exNorm) ||
        exNorm.includes(extNorm) ||
        dist <= 3
      const typeMatch = typesMatch(ext.detectedType, ex.roomTypeName)

      if (nameOverlap && typeMatch) {
        candidates.push({
          tempId: ext.tempId,
          roomId: ex.id,
          score: 0.8,
          reason: `Name + type match: "${ex.name}" (${ex.roomTypeName})`,
        })
        continue
      }

      // Type-only match (weaker)
      if (typeMatch && dist <= 5) {
        candidates.push({
          tempId: ext.tempId,
          roomId: ex.id,
          score: 0.5,
          reason: `Type match: "${ex.name}" (${ex.roomTypeName})`,
        })
      }
    }
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score)

  // Greedy assignment: each existing room matched at most once
  const usedExisting = new Set<string>()
  const usedExtracted = new Set<string>()
  const assignments = new Map<string, { roomId: string; score: number; reason: string }>()

  for (const c of candidates) {
    if (usedExtracted.has(c.tempId) || usedExisting.has(c.roomId)) continue
    assignments.set(c.tempId, {
      roomId: c.roomId,
      score: c.score,
      reason: c.reason,
    })
    usedExtracted.add(c.tempId)
    usedExisting.add(c.roomId)
  }

  // Build results
  return extracted.map((ext) => {
    const match = assignments.get(ext.tempId)
    return {
      tempId: ext.tempId,
      matchedRoomId: match?.roomId || null,
      matchScore: match?.score || 0,
      matchReason: match?.reason || "No match found",
    }
  })
}
