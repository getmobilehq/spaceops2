"use server"

import { createClient } from "@/lib/supabase/server"
import { canAccess } from "@/lib/plans"
import { getClaudeClient } from "@/lib/claude"

interface ReportDataForAI {
  dateRange: { from?: string; to?: string }
  orgName: string
  summary: {
    totalTasks: number
    passedTasks: number
    failedTasks: number
    passRate: number | null
    totalActivities: number
    openDeficiencies: number
  }
  previousSummary?: {
    passRate: number | null
    totalActivities: number
    openDeficiencies: number
  }
  buildingCount: number
  clientCount: number
  floorCount: number
  topBuildings: { name: string; passRate: number }[]
  bottomBuildings: { name: string; passRate: number }[]
  issueBreakdown: { high: number; medium: number; low: number; open: number }
}

export async function generateExecutiveSummary(
  data: ReportDataForAI
): Promise<string> {
  // Check plan allows AI reports
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const orgId = user.app_metadata?.org_id as string | undefined
    if (orgId) {
      const { data: orgData } = await supabase
        .from("organisations")
        .select("plan")
        .eq("id", orgId)
        .single()

      if (!canAccess("ai_reports", (orgData?.plan as "free" | "pro" | "enterprise") || "free")) {
        return "AI report generation requires a Pro or Enterprise plan."
      }
    }
  }

  const claude = getClaudeClient()

  const dateRangeStr = data.dateRange.from && data.dateRange.to
    ? `from ${data.dateRange.from} to ${data.dateRange.to}`
    : data.dateRange.from
    ? `from ${data.dateRange.from} onwards`
    : "the reporting period"

  const passRateDelta = data.summary.passRate !== null && data.previousSummary?.passRate !== null
    ? data.summary.passRate - (data.previousSummary?.passRate ?? 0)
    : null

  const prompt = `You are a senior facilities management consultant writing an executive summary for a cleaning operations performance report.

Organization: ${data.orgName}
Period: ${dateRangeStr}

Key Metrics:
- Overall Pass Rate: ${data.summary.passRate !== null ? `${data.summary.passRate}%` : "N/A"}${passRateDelta !== null ? ` (${passRateDelta >= 0 ? "+" : ""}${passRateDelta}% vs previous period)` : ""}
- Total Activities: ${data.summary.totalActivities}${data.previousSummary ? ` (prev: ${data.previousSummary.totalActivities})` : ""}
- Tasks Inspected: ${data.summary.passedTasks + data.summary.failedTasks} (${data.summary.passedTasks} passed, ${data.summary.failedTasks} failed)
- Open Deficiencies: ${data.summary.openDeficiencies}
- Portfolio: ${data.buildingCount} buildings, ${data.clientCount} clients, ${data.floorCount} floors

Top Performing Buildings:
${data.topBuildings.map(b => `- ${b.name}: ${b.passRate}%`).join("\n") || "- No data available"}

Underperforming Buildings:
${data.bottomBuildings.map(b => `- ${b.name}: ${b.passRate}%`).join("\n") || "- No data available"}

Issue Breakdown:
- High severity: ${data.issueBreakdown.high}
- Medium severity: ${data.issueBreakdown.medium}
- Low severity: ${data.issueBreakdown.low}
- Currently open: ${data.issueBreakdown.open}

Write a professional executive summary (2-3 paragraphs) that:
1. Opens with the overall operational performance and key headline metrics
2. Highlights notable trends, top/bottom performers, and areas of concern
3. Closes with actionable recommendations

Use a professional, confident tone. Be specific with numbers. Do not use bullet points — write in flowing paragraphs. Do not include headers or titles.`

  const response = await claude.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  })

  // Record usage event (fire-and-forget)
  const orgId = user?.app_metadata?.org_id as string | undefined
  if (orgId) {
    const { recordUsageEvent } = await import("@/lib/usage")
    await recordUsageEvent({
      orgId,
      eventType: "ai_report",
      metadata: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      },
    })
  }

  const textBlock = response.content.find((b) => b.type === "text")
  return textBlock?.text || "Executive summary could not be generated."
}
