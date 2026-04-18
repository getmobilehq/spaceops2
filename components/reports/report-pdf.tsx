"use client"

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Circle,
  G,
  Path,
} from "@react-pdf/renderer"
import type { ReportData } from "./report-types"

// Register Public Sans font
Font.register({
  family: "PublicSans",
  fonts: [
    { src: "https://fonts.gstatic.com/s/publicsans/v15/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymu.woff2", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/publicsans/v15/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymufp8.woff2", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/publicsans/v15/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymukJ0.woff2", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/publicsans/v15/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymuj50.woff2", fontWeight: 700 },
  ],
})

const C = {
  primary: "#7367F0",
  primaryLight: "#EDE8FF",
  success: "#28C76F",
  destructive: "#EA5455",
  warning: "#FF9F43",
  info: "#00CFE8",
  text: "#2F3349",
  textLight: "#6F6B7D",
  muted: "#A8AAAE",
  border: "#DBDADE",
  bg: "#F8F7FA",
  white: "#FFFFFF",
}

const s = StyleSheet.create({
  page: {
    fontFamily: "PublicSans",
    fontSize: 9,
    color: C.text,
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  // Cover page
  coverPage: {
    fontFamily: "PublicSans",
    backgroundColor: C.white,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 60,
  },
  coverAccent: {
    width: 80,
    height: 4,
    backgroundColor: C.primary,
    marginBottom: 30,
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: C.text,
    textAlign: "center",
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: C.textLight,
    textAlign: "center",
    marginBottom: 40,
  },
  coverMeta: {
    fontSize: 11,
    color: C.muted,
    textAlign: "center",
    marginBottom: 6,
  },
  coverOrg: {
    fontSize: 18,
    fontWeight: 600,
    color: C.primary,
    textAlign: "center",
    marginBottom: 30,
  },
  // Header / Footer
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: C.primary,
  },
  headerOrgName: {
    fontSize: 8,
    fontWeight: 600,
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerSection: {
    fontSize: 8,
    color: C.muted,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
  // Section titles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: C.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 10,
    color: C.textLight,
    marginBottom: 20,
  },
  // KPI grid
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 14,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8,
    color: C.textLight,
    marginBottom: 4,
  },
  kpiDelta: {
    fontSize: 7,
    fontWeight: 500,
  },
  // Tables
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tableCell: {
    fontSize: 8,
    color: C.text,
  },
  // Executive summary
  summaryText: {
    fontSize: 10,
    lineHeight: 1.7,
    color: C.text,
    marginBottom: 12,
  },
  // Floor plan
  floorPlanContainer: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  floorPlanImage: {
    width: "100%",
    height: 340,
    objectFit: "contain",
    backgroundColor: C.bg,
  },
  floorPlanLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: C.text,
    marginBottom: 4,
  },
  floorPlanSub: {
    fontSize: 8,
    color: C.textLight,
    marginBottom: 8,
  },
})

// --- Chart Primitives ---

function PdfHorizontalBar({
  label,
  passed,
  failed,
  passRate,
}: {
  label: string
  passed: number
  failed: number
  passRate: number
}) {
  const total = passed + failed
  const passWidth = total > 0 ? (passed / total) * 100 : 0
  const barHeight = 8
  const barWidth = 300

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 3 }}>
        <Text style={{ fontSize: 8, fontWeight: 500 }}>{label}</Text>
        <Text
          style={{
            fontSize: 8,
            fontWeight: 600,
            color: passRate >= 80 ? C.success : passRate >= 50 ? C.warning : C.destructive,
          }}
        >
          {passRate}%
        </Text>
      </View>
      <Svg width={barWidth} height={barHeight}>
        <Rect x={0} y={0} width={barWidth} height={barHeight} rx={4} fill={C.bg} />
        <Rect
          x={0}
          y={0}
          width={(passWidth / 100) * barWidth}
          height={barHeight}
          rx={passWidth >= 100 ? 4 : 0}
          fill={C.success}
        />
        <Rect
          x={(passWidth / 100) * barWidth}
          y={0}
          width={((100 - passWidth) / 100) * barWidth}
          height={barHeight}
          fill={C.destructive}
        />
      </Svg>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2 }}>
        <Text style={{ fontSize: 7, color: C.muted }}>{passed} passed · {failed} failed</Text>
        <Text style={{ fontSize: 7, color: C.muted }}>{total} inspected</Text>
      </View>
    </View>
  )
}

function PdfDonutChart({
  data,
  size = 100,
}: {
  data: { name: string; value: number; color: string }[]
  size?: number
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2 - 2
  const innerR = outerR * 0.6

  let startAngle = -90
  const arcs = data.map((d) => {
    const angle = (d.value / total) * 360
    const start = startAngle
    startAngle += angle
    return { ...d, startAngle: start, endAngle: start + angle }
  })

  function polarToCart(centerX: number, centerY: number, radius: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: centerX + radius * Math.cos(rad), y: centerY + radius * Math.sin(rad) }
  }

  function arcPath(startA: number, endA: number, outerRadius: number, innerRadius: number) {
    const s1 = polarToCart(cx, cy, outerRadius, startA)
    const e1 = polarToCart(cx, cy, outerRadius, endA)
    const s2 = polarToCart(cx, cy, innerRadius, endA)
    const e2 = polarToCart(cx, cy, innerRadius, startA)
    const large = endA - startA > 180 ? 1 : 0

    return `M ${s1.x} ${s1.y} A ${outerRadius} ${outerRadius} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${innerRadius} ${innerRadius} 0 ${large} 0 ${e2.x} ${e2.y} Z`
  }

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size}>
        <G>
          {arcs.map((arc) => (
            <Path
              key={arc.name}
              d={arcPath(arc.startAngle, arc.endAngle - 0.5, outerR, innerR)}
              fill={arc.color}
            />
          ))}
          <Circle cx={cx} cy={cy} r={innerR - 1} fill={C.white} />
        </G>
      </Svg>
      <Text style={{ fontSize: 14, fontWeight: 700, marginTop: -size / 2 - 6, marginBottom: size / 2 - 14 }}>
        {total}
      </Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {data.map((d) => (
          <View key={d.name} style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Svg width={8} height={8}><Circle cx={4} cy={4} r={4} fill={d.color} /></Svg>
            <Text style={{ fontSize: 7, color: C.muted }}>{d.name}: {d.value}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// --- Page Template ---

function PageTemplate({
  children,
  orgName,
  section,
}: {
  children: React.ReactNode
  orgName: string
  section: string
}) {
  return (
    <Page size="A4" style={s.page}>
      <View style={s.header} fixed>
        <Text style={s.headerOrgName}>{orgName}</Text>
        <Text style={s.headerSection}>{section}</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text
          style={s.footerText}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
        <Text style={s.footerText}>
          Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · Confidential
        </Text>
      </View>
    </Page>
  )
}

// --- Main Document ---

export function ReportPDF({ data }: { data: ReportData }) {
  const dateRange =
    data.filters.dateFrom && data.filters.dateTo
      ? `${data.filters.dateFrom} to ${data.filters.dateTo}`
      : data.filters.dateFrom
      ? `From ${data.filters.dateFrom}`
      : "All Time"

  const prevPassRate = data.previousSummary?.passRate ?? null
  const passRateDelta =
    data.summary.passRate !== null && prevPassRate !== null
      ? data.summary.passRate - prevPassRate
      : null

  const prevActivities = data.previousSummary?.totalActivities ?? null
  const activitiesDelta =
    prevActivities !== null
      ? data.summary.totalActivities - prevActivities
      : null

  return (
    <Document title={`${data.orgName} - Operations Performance Report`} author={data.orgName}>
      {/* === COVER PAGE === */}
      <Page size="A4" style={s.coverPage}>
        {data.orgLogoUrl && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={data.orgLogoUrl} style={{ width: 80, height: 80, marginBottom: 20, objectFit: "contain" }} />
        )}
        <View style={s.coverAccent} />
        <Text style={s.coverOrg}>{data.orgName}</Text>
        <Text style={s.coverTitle}>Operations{"\n"}Performance Report</Text>
        <Text style={s.coverSubtitle}>{dateRange}</Text>
        <View style={{ marginTop: 40 }}>
          <Text style={s.coverMeta}>
            {data.buildingCount} Buildings · {data.clientCount} Clients · {data.floorCount} Floors
          </Text>
          <Text style={s.coverMeta}>
            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </View>
      </Page>

      {/* === EXECUTIVE SUMMARY === */}
      <PageTemplate orgName={data.orgName} section="Executive Summary">
        <Text style={s.sectionTitle}>Executive Summary</Text>
        <Text style={s.sectionSubtitle}>AI-generated analysis of operational performance</Text>
        {data.executiveSummary.split("\n\n").map((paragraph, i) => (
          <Text key={i} style={s.summaryText}>{paragraph}</Text>
        ))}
      </PageTemplate>

      {/* === KPI DASHBOARD === */}
      <PageTemplate orgName={data.orgName} section="Key Performance Indicators">
        <Text style={s.sectionTitle}>Key Performance Indicators</Text>
        <Text style={s.sectionSubtitle}>Period overview with comparison to previous period</Text>

        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.primary }}>
              {data.summary.passRate !== null ? `${data.summary.passRate}%` : "N/A"}
            </Text>
            <Text style={s.kpiLabel}>Overall Pass Rate</Text>
            {passRateDelta !== null && (
              <Text style={{ ...s.kpiDelta, color: passRateDelta >= 0 ? C.success : C.destructive }}>
                {passRateDelta >= 0 ? "+" : ""}{passRateDelta}% vs previous period
              </Text>
            )}
          </View>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.info }}>{data.summary.totalActivities}</Text>
            <Text style={s.kpiLabel}>Total Activities</Text>
            {activitiesDelta !== null && (
              <Text style={{ ...s.kpiDelta, color: activitiesDelta >= 0 ? C.success : C.destructive }}>
                {activitiesDelta >= 0 ? "+" : ""}{activitiesDelta} vs previous period
              </Text>
            )}
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <View style={{ flexDirection: "row", gap: 4, alignItems: "baseline" }}>
              <Text style={{ ...s.kpiValue, color: C.success }}>{data.summary.passedTasks}</Text>
              <Text style={{ fontSize: 14, color: C.muted }}>/</Text>
              <Text style={{ ...s.kpiValue, color: C.destructive }}>{data.summary.failedTasks}</Text>
            </View>
            <Text style={s.kpiLabel}>Passed / Failed Inspections</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.destructive }}>{data.summary.openDeficiencies}</Text>
            <Text style={s.kpiLabel}>Open Deficiencies</Text>
          </View>
        </View>

        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.text }}>{data.summary.totalTasks}</Text>
            <Text style={s.kpiLabel}>Total Room Tasks</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.warning }}>{data.summary.inProgressTasks}</Text>
            <Text style={s.kpiLabel}>In Progress</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={{ ...s.kpiValue, color: C.success }}>{data.summary.doneTasks}</Text>
            <Text style={s.kpiLabel}>Completed</Text>
          </View>
        </View>
      </PageTemplate>

      {/* === BUILDING PERFORMANCE === */}
      {data.byBuilding.length > 0 && (
        <PageTemplate orgName={data.orgName} section="Building Performance">
          <Text style={s.sectionTitle}>Building Performance</Text>
          <Text style={s.sectionSubtitle}>Inspection pass rates by building</Text>
          {data.byBuilding.map((b) => (
            <PdfHorizontalBar key={b.name} label={b.name} passed={b.passed} failed={b.failed} passRate={b.passRate} />
          ))}
        </PageTemplate>
      )}

      {/* === CLIENT PERFORMANCE === */}
      {data.byClient.length > 0 && (
        <PageTemplate orgName={data.orgName} section="Client Performance">
          <Text style={s.sectionTitle}>Client Performance</Text>
          <Text style={s.sectionSubtitle}>Inspection pass rates by client</Text>
          {data.byClient.map((c) => (
            <PdfHorizontalBar key={c.name} label={c.name} passed={c.passed} failed={c.failed} passRate={c.passRate} />
          ))}
        </PageTemplate>
      )}

      {/* === FLOOR ANALYSIS === */}
      {data.byFloor.length > 0 && (
        <PageTemplate orgName={data.orgName} section="Floor Analysis">
          <Text style={s.sectionTitle}>Floor Analysis</Text>
          <Text style={s.sectionSubtitle}>Inspection pass rates by floor</Text>
          {data.byFloor.map((f) => (
            <PdfHorizontalBar
              key={`${f.buildingName}-${f.name}`}
              label={`${f.name} (${f.buildingName})`}
              passed={f.passed}
              failed={f.failed}
              passRate={f.passRate}
            />
          ))}
        </PageTemplate>
      )}

      {/* === FLOOR PLANS === */}
      {data.floorPlans.map((fp) => (
        <PageTemplate key={fp.floorId} orgName={data.orgName} section="Floor Plans">
          <Text style={s.floorPlanLabel}>{fp.buildingName} — {fp.floorName}</Text>
          <Text style={s.floorPlanSub}>{fp.roomCount} rooms</Text>
          <View style={s.floorPlanContainer}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={fp.imageUrl} style={s.floorPlanImage} />
          </View>
        </PageTemplate>
      ))}

      {/* === ISSUES & DEFICIENCIES === */}
      {(data.deficiencies.total > 0 || data.issues.length > 0) && (
        <PageTemplate orgName={data.orgName} section="Issues & Deficiencies">
          <Text style={s.sectionTitle}>Issues & Deficiencies</Text>
          <Text style={s.sectionSubtitle}>Severity and status breakdown with detailed listing</Text>

          {data.deficiencies.total > 0 && (
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 8, fontWeight: 600, marginBottom: 6 }}>By Severity</Text>
                <PdfDonutChart
                  data={[
                    { name: "High", value: data.deficiencies.bySeverity.high, color: C.destructive },
                    { name: "Medium", value: data.deficiencies.bySeverity.medium, color: C.warning },
                    { name: "Low", value: data.deficiencies.bySeverity.low, color: C.info },
                  ]}
                />
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 8, fontWeight: 600, marginBottom: 6 }}>By Status</Text>
                <PdfDonutChart
                  data={[
                    { name: "Open", value: data.deficiencies.byStatus.open, color: C.destructive },
                    { name: "In Progress", value: data.deficiencies.byStatus.in_progress, color: C.warning },
                    { name: "Resolved", value: data.deficiencies.byStatus.resolved, color: C.success },
                  ]}
                />
              </View>
            </View>
          )}

          {data.issues.length > 0 && (
            <View>
              <View style={s.tableHeader}>
                <Text style={{ ...s.tableHeaderCell, width: "25%" }}>Description</Text>
                <Text style={{ ...s.tableHeaderCell, width: "10%" }}>Severity</Text>
                <Text style={{ ...s.tableHeaderCell, width: "10%" }}>Status</Text>
                <Text style={{ ...s.tableHeaderCell, width: "15%" }}>Building</Text>
                <Text style={{ ...s.tableHeaderCell, width: "12%" }}>Floor</Text>
                <Text style={{ ...s.tableHeaderCell, width: "13%" }}>Room</Text>
                <Text style={{ ...s.tableHeaderCell, width: "15%" }}>Reporter</Text>
              </View>
              {data.issues.slice(0, 25).map((issue) => (
                <View key={issue.id} style={s.tableRow} wrap={false}>
                  <Text style={{ ...s.tableCell, width: "25%" }}>{issue.description.substring(0, 40)}</Text>
                  <Text
                    style={{
                      ...s.tableCell,
                      width: "10%",
                      color: issue.severity === "high" ? C.destructive : issue.severity === "medium" ? C.warning : C.info,
                      fontWeight: 500,
                    }}
                  >
                    {issue.severity}
                  </Text>
                  <Text style={{ ...s.tableCell, width: "10%" }}>{issue.status.replace("_", " ")}</Text>
                  <Text style={{ ...s.tableCell, width: "15%", color: C.textLight }}>{issue.buildingName}</Text>
                  <Text style={{ ...s.tableCell, width: "12%", color: C.textLight }}>{issue.floorName}</Text>
                  <Text style={{ ...s.tableCell, width: "13%", color: C.textLight }}>{issue.roomName}</Text>
                  <Text style={{ ...s.tableCell, width: "15%", color: C.textLight }}>{issue.reporterName}</Text>
                </View>
              ))}
              {data.issues.length > 25 && (
                <Text style={{ fontSize: 7, color: C.muted, marginTop: 6 }}>
                  Showing 25 of {data.issues.length} issues
                </Text>
              )}
            </View>
          )}
        </PageTemplate>
      )}

      {/* === STAFF HOURS === */}
      {data.timeWorkedByJanitor.length > 0 && (
        <PageTemplate orgName={data.orgName} section="Staff Hours">
          <Text style={s.sectionTitle}>Staff Hours</Text>
          <Text style={s.sectionSubtitle}>Time worked by staff member based on clock-in / clock-out records</Text>

          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderCell, width: "40%" }}>Staff Member</Text>
            <Text style={{ ...s.tableHeaderCell, width: "20%", textAlign: "right" }}>Hours Worked</Text>
            <Text style={{ ...s.tableHeaderCell, width: "20%", textAlign: "right" }}>Shifts</Text>
            <Text style={{ ...s.tableHeaderCell, width: "20%", textAlign: "right" }}>Avg Hrs / Shift</Text>
          </View>
          {data.timeWorkedByJanitor.map((tw) => (
            <View key={tw.name} style={s.tableRow} wrap={false}>
              <Text style={{ ...s.tableCell, width: "40%", fontWeight: 500 }}>{tw.name}</Text>
              <Text style={{ ...s.tableCell, width: "20%", textAlign: "right" }}>{tw.hoursWorked}</Text>
              <Text style={{ ...s.tableCell, width: "20%", textAlign: "right" }}>{tw.shifts}</Text>
              <Text style={{ ...s.tableCell, width: "20%", textAlign: "right" }}>{tw.avgShiftHours}</Text>
            </View>
          ))}
          <View style={{ ...s.tableRow, borderBottomWidth: 0 }} wrap={false}>
            <Text style={{ ...s.tableCell, width: "40%", fontWeight: 700 }}>Total</Text>
            <Text style={{ ...s.tableCell, width: "20%", textAlign: "right", fontWeight: 700 }}>
              {data.timeWorkedByJanitor.reduce((sum, tw) => sum + tw.hoursWorked, 0).toFixed(1)}
            </Text>
            <Text style={{ ...s.tableCell, width: "20%", textAlign: "right", fontWeight: 700 }}>
              {data.timeWorkedByJanitor.reduce((sum, tw) => sum + tw.shifts, 0)}
            </Text>
            <Text style={{ ...s.tableCell, width: "20%", textAlign: "right", color: C.muted }}>—</Text>
          </View>
        </PageTemplate>
      )}

      {/* === ACTIVITY HISTORY === */}
      {data.history.length > 0 && (
        <PageTemplate orgName={data.orgName} section="Activity History">
          <Text style={s.sectionTitle}>Activity History</Text>
          <Text style={s.sectionSubtitle}>Recent cleaning activities with inspection results</Text>

          <View style={s.tableHeader}>
            <Text style={{ ...s.tableHeaderCell, width: "20%" }}>Activity</Text>
            <Text style={{ ...s.tableHeaderCell, width: "18%" }}>Building</Text>
            <Text style={{ ...s.tableHeaderCell, width: "12%" }}>Date</Text>
            <Text style={{ ...s.tableHeaderCell, width: "12%" }}>Status</Text>
            <Text style={{ ...s.tableHeaderCell, width: "10%", textAlign: "center" }}>Rooms</Text>
            <Text style={{ ...s.tableHeaderCell, width: "10%", textAlign: "center" }}>Pass</Text>
            <Text style={{ ...s.tableHeaderCell, width: "10%", textAlign: "center" }}>Fail</Text>
            <Text style={{ ...s.tableHeaderCell, width: "8%", textAlign: "right" }}>Rate</Text>
          </View>
          {data.history.slice(0, 30).map((a) => (
            <View key={a.id} style={s.tableRow} wrap={false}>
              <Text style={{ ...s.tableCell, width: "20%", fontWeight: 500 }}>{a.name}</Text>
              <Text style={{ ...s.tableCell, width: "18%", color: C.textLight }}>
                {a.buildingName}
              </Text>
              <Text style={{ ...s.tableCell, width: "12%", color: C.textLight }}>
                {new Date(a.scheduledDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </Text>
              <Text style={{ ...s.tableCell, width: "12%" }}>{a.status}</Text>
              <Text style={{ ...s.tableCell, width: "10%", textAlign: "center" }}>
                {a.completedRooms}/{a.totalRooms}
              </Text>
              <Text style={{ ...s.tableCell, width: "10%", textAlign: "center", color: C.success }}>
                {a.passedRooms}
              </Text>
              <Text style={{ ...s.tableCell, width: "10%", textAlign: "center", color: C.destructive }}>
                {a.failedRooms}
              </Text>
              <Text
                style={{
                  ...s.tableCell,
                  width: "8%",
                  textAlign: "right",
                  fontWeight: 600,
                  color: a.passRate !== null
                    ? a.passRate >= 80 ? C.success : a.passRate >= 50 ? C.warning : C.destructive
                    : C.muted,
                }}
              >
                {a.passRate !== null ? `${a.passRate}%` : "—"}
              </Text>
            </View>
          ))}
          {data.history.length > 30 && (
            <Text style={{ fontSize: 7, color: C.muted, marginTop: 6 }}>
              Showing 30 of {data.history.length} activities
            </Text>
          )}
        </PageTemplate>
      )}
    </Document>
  )
}
