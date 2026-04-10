import type { ReportFilters } from "@/lib/queries/reports"

export interface ReportSummary {
  totalTasks: number
  passedTasks: number
  failedTasks: number
  inspectedTasks: number
  doneTasks: number
  inProgressTasks: number
  passRate: number | null
  totalActivities: number
  openDeficiencies: number
}

export interface ByBuilding {
  name: string
  passed: number
  failed: number
  total: number
  passRate: number
}

export interface ByJanitor {
  name: string
  passed: number
  failed: number
  total: number
  passRate: number
}

export interface TimeWorkedByJanitor {
  name: string
  totalMinutes: number
  hoursWorked: number
  shifts: number
  avgShiftHours: number
}

export interface ByClient {
  name: string
  passed: number
  failed: number
  total: number
  passRate: number
}

export interface ByFloor {
  name: string
  buildingName: string
  passed: number
  failed: number
  total: number
  passRate: number
}

export interface IssueRow {
  id: string
  description: string
  severity: string
  status: string
  createdAt: string
  buildingName: string
  floorName: string
  roomName: string
  reporterName: string
}

export interface ActivityRow {
  id: string
  name: string
  status: string
  scheduledDate: string
  buildingName: string
  floorName: string
  totalRooms: number
  completedRooms: number
  passedRooms: number
  failedRooms: number
  passRate: number | null
}

export interface DeficiencyBreakdown {
  total: number
  bySeverity: { low: number; medium: number; high: number }
  byStatus: { open: number; in_progress: number; resolved: number }
}

export interface FloorPlanData {
  floorId: string
  buildingName: string
  floorName: string
  imageUrl: string
  roomCount: number
}

export interface ReportData {
  orgName: string
  orgLogoUrl: string | null
  filters: ReportFilters
  executiveSummary: string
  summary: ReportSummary
  previousSummary?: ReportSummary
  byBuilding: ByBuilding[]
  byJanitor: ByJanitor[]
  timeWorkedByJanitor: TimeWorkedByJanitor[]
  byClient: ByClient[]
  byFloor: ByFloor[]
  issues: IssueRow[]
  history: ActivityRow[]
  deficiencies: DeficiencyBreakdown
  floorPlans: FloorPlanData[]
  buildingCount: number
  clientCount: number
  floorCount: number
}
