import { NextRequest, NextResponse } from "next/server"
import { generateRecurringActivities } from "@/actions/activity-templates"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await generateRecurringActivities()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    created: result.created,
    date: new Date().toISOString().split("T")[0],
  })
}
