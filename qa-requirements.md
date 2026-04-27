# SpaceOps — QA Requirements & Test Scenarios

> Prepared for external QA testing team.
> Platform: Responsive web application (Next.js 14 / Supabase / Stripe)
> Last updated: 27 April 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Environments & Access](#2-environments--access)
3. [User Roles](#3-user-roles)
4. [Auth Flows](#4-auth-flows)
5. [Admin Flows](#5-admin-flows)
6. [Supervisor Flows](#6-supervisor-flows)
7. [Janitor Flows](#7-janitor-flows)
8. [Client Flows](#8-client-flows)
9. [Platform Admin Flows](#9-platform-admin-flows)
10. [QR Scanning (Public)](#10-qr-scanning-public)
11. [Plan Gating Matrix](#11-plan-gating-matrix)
12. [Validation Rules Reference](#12-validation-rules-reference)
13. [Security Test Scenarios](#13-security-test-scenarios)
14. [Recommended Test Paths](#14-recommended-test-paths)

---

## 1. Product Overview

SpaceOps is a facility management platform for commercial cleaning operations. It handles scheduling, GPS-verified attendance, quality inspections, issue tracking, reporting, payroll, and client transparency.

**Tech stack:** Next.js 14 (React), Supabase (PostgreSQL + Auth), Stripe (billing), Anthropic Claude (AI features)

**Access method:** Responsive web app — no native mobile app. Janitors use it on mobile browsers. Supervisors and admins use desktop or tablet.

**Supported languages:** English, Spanish, French (auto-detected from browser, switchable)

---

## 2. Environments & Access

| Environment | URL | Purpose |
|---|---|---|
| Production | *(to be provided)* | Live environment |
| Staging | *(to be provided)* | QA testing |

**Test accounts will be provided for each role.** Each account belongs to a test organisation with pre-populated data (buildings, floors, rooms, activities, attendance records).

---

## 3. User Roles

| Role | Access Level | Primary Device |
|---|---|---|
| **Admin** | Full org control — buildings, users, checklists, reports, payroll, billing, settings | Desktop |
| **Supervisor** | Day-to-day ops — activities, inspections, templates, attendance, issues (scoped to assigned buildings) | Desktop / Tablet |
| **Janitor** | Task execution — clock in/out, today's tasks, issue reporting | Mobile (browser) |
| **Client** | Read-only — building overview, activity pass rates, SLA metrics, issues | Desktop |
| **Platform Admin** | Cross-org platform management — org plans, suspend, delete, usage stats (super admin only) | Desktop |

---

## 4. Auth Flows

### 4.1 Registration

**URL:** `/register`

**User Story:** As a new user, I want to create an organisation account so I can start managing my cleaning operations.

| Field | Type | Validation | Required |
|---|---|---|---|
| Organisation Name | text | 2–100 characters | Yes |
| First Name | text | 1–50 characters | Yes |
| Last Name | text | 1–50 characters | Yes |
| Email | email | Valid email format | Yes |
| Password | text | 8+ chars, must contain uppercase, lowercase, and digit | Yes |

**Acceptance Criteria:**
- [ ] Account is created and user is auto-signed in
- [ ] User lands on the onboarding wizard
- [ ] Organisation is created on the Free plan
- [ ] Duplicate email shows an error (does not reveal which emails exist)

---

### 4.2 Login

**URL:** `/auth/login`

| Field | Type | Validation | Required |
|---|---|---|---|
| Email | email | Valid email | Yes |
| Password | text | 6+ characters | Yes |

**Acceptance Criteria:**
- [ ] Valid credentials redirect to role-appropriate dashboard
- [ ] Invalid credentials show generic error (no email enumeration)
- [ ] "Forgot your password?" link navigates to reset page

---

### 4.3 Password Reset

**URL:** `/auth/reset-password`

| Field | Type | Validation | Required |
|---|---|---|---|
| Email | email | Valid email | Yes |

**Acceptance Criteria:**
- [ ] Always shows "Check your email" message (prevents email enumeration)
- [ ] Valid email receives a reset link
- [ ] Reset link opens the set-new-password form
- [ ] New password must meet strength requirements (8+ chars, uppercase, lowercase, digit)

---

### 4.4 Invite Acceptance

**URL:** `/auth/invite` (accessed via email link)

| Field | Type | Validation | Required |
|---|---|---|---|
| Password | text | 8+ chars, uppercase + lowercase + digit | Yes |
| Confirm Password | text | Must match password | Yes |

**Acceptance Criteria:**
- [ ] Invited user can set their password
- [ ] After setting password, user is redirected to their dashboard
- [ ] `must_change_password` flag is cleared

---

## 5. Admin Flows

### 5.1 Dashboard

**URL:** `/{org}/admin/dashboard`

**Acceptance Criteria:**
- [ ] Shows active buildings count
- [ ] Shows open issues count
- [ ] Shows activities this week
- [ ] Shows average pass rate
- [ ] Shows recent activity feed

---

### 5.2 Buildings

#### 5.2.1 Create Building

**URL:** `/{org}/admin/buildings/new`

| Field | Type | Validation | Required |
|---|---|---|---|
| Building Name | text | 1–100 chars | Yes |
| Street Address | text | 1–200 chars | Yes |
| City | text | 1–100 chars | Yes |
| State | text | 1–100 chars | Yes |
| ZIP Code | text | 1–20 chars | Yes |
| Country | text | 1–100 chars | Yes |
| Floors | array | Min 1 floor (number + name) | Yes |
| Client | select | UUID or none | No |

**Acceptance Criteria:**
- [ ] Building is created with specified floors
- [ ] On Free plan, creating a second building is blocked with upgrade prompt
- [ ] On Pro/Enterprise, unlimited buildings can be created
- [ ] Redirect to building detail page after creation

#### 5.2.2 Edit Building

**URL:** `/{org}/admin/buildings/{id}`

**Additional fields available on edit:**
- Status (setup / active / inactive)
- Latitude (-90 to 90)
- Longitude (-180 to 180)
- Geofence Radius (10–5000 metres, default 150)

**Acceptance Criteria:**
- [ ] All fields save correctly
- [ ] Geofence radius is used for janitor clock-in GPS verification
- [ ] Supervisors can be assigned/removed from the building

#### 5.2.3 Floors & Rooms

**URL:** `/{org}/admin/buildings/{id}/floors/{fid}`

**Acceptance Criteria:**
- [ ] Rooms can be created with a name and room type
- [ ] QR code is auto-generated for each new room
- [ ] Floor plan image can be uploaded (JPEG, PNG, WebP, PDF — max 10 MB)
- [ ] AI room detection can be triggered (Pro/Enterprise only)
- [ ] If AI detection fails, helpful error message and tips are shown
- [ ] Rooms can be added manually regardless of AI detection
- [ ] Room pins (x, y) can be positioned on the floor plan

#### 5.2.4 AI Floor Plan Vectorisation

**Acceptance Criteria:**
- [ ] Blocked on Free plan with upgrade prompt
- [ ] On Pro/Enterprise, AI detects rooms from uploaded floor plan
- [ ] Detected rooms can be reviewed: match to existing, create new, or skip
- [ ] Rooms can be merged or split in the review UI
- [ ] If AI returns invalid coordinates, system auto-normalises (no error shown to user)
- [ ] If AI completely fails, user sees actionable guidance (retry, re-upload, or add manually)
- [ ] Image tips are shown near the upload button (high contrast, cropped, digital exports)

#### 5.2.5 Delete Building

**Acceptance Criteria:**
- [ ] Confirmation dialog required
- [ ] Cascades: all floors, rooms, and associated data are removed
- [ ] Building disappears from list after deletion

---

### 5.3 Users

#### 5.3.1 Invite User

**URL:** `/{org}/admin/users/invite`

| Field | Type | Validation | Required |
|---|---|---|---|
| Email | email | Valid, must not already exist | Yes |
| First Name | text | 1–50 chars | Yes |
| Last Name | text | 1–50 chars | Yes |
| Role | select | admin / supervisor / janitor / client | Yes |

**Acceptance Criteria:**
- [ ] On Free plan, blocked after 5 users with upgrade prompt
- [ ] User receives invitation email with temporary credentials
- [ ] Invited user appears in users list immediately
- [ ] Duplicate email shows error

#### 5.3.2 Edit / Deactivate / Delete User

**Acceptance Criteria:**
- [ ] Name and role can be updated
- [ ] User can be deactivated (soft disable) and reactivated
- [ ] Deactivated users cannot log in
- [ ] User can be permanently deleted (auth record removed)

---

### 5.4 Clients

**URL:** `/{org}/admin/clients`

| Field | Type | Validation | Required |
|---|---|---|---|
| Company Name | text | 1–100 chars | Yes |
| Contact Name | text | 1–100 chars | Yes |
| Contact Email | email | Valid email | Yes |

**Acceptance Criteria:**
- [ ] Clients can be created, edited, deleted
- [ ] Deleting a client unlinks associated buildings (does not delete them)
- [ ] Client can be linked to a building during building creation or edit

---

### 5.5 Checklists

**URL:** `/{org}/admin/checklists`

**Acceptance Criteria:**
- [ ] Checklist templates can be created with a name
- [ ] Items can be added with description, photo requirement flag, note requirement flag
- [ ] Items can be reordered by drag or explicit reorder action
- [ ] A template can be set as default for a room type
- [ ] A specific room can have a template override
- [ ] Global (shared library) templates can be cloned into the org
- [ ] Templates can be deleted (only if not actively in use)

---

### 5.6 Settings

**URL:** `/{org}/admin/settings`

| Field | Type | Validation | Required |
|---|---|---|---|
| Organisation Name | text | 1–100 chars | Yes |
| Pass Threshold | slider | 0–100 (integer) | Yes |
| Logo | file upload | JPEG/PNG/WebP/SVG, max 2 MB | No |

**Acceptance Criteria:**
- [ ] Name change reflects in sidebar and reports
- [ ] Pass threshold affects inspection pass/fail determination across the org
- [ ] Logo appears on PDF reports and the sidebar

---

### 5.7 Reports

**URL:** `/{org}/admin/reports`

**Acceptance Criteria:**
- [ ] Reports dashboard shows KPIs: pass rate, total activities, passed/failed, open deficiencies
- [ ] Filters work: date range, building, client, floor
- [ ] "Generate Report" produces a preview with all sections
- [ ] PDF download includes: cover page, AI executive summary, KPIs, building performance, client performance, floor analysis, floor plans, issues table, activity history, staff hours
- [ ] AI executive summary is only available on Pro/Enterprise plans
- [ ] CSV export works for each data view
- [ ] Organisation logo appears on PDF

---

### 5.8 Payroll

**URL:** `/{org}/admin/payroll`

#### 5.8.1 Pay Rates Tab

| Field | Type | Validation | Required |
|---|---|---|---|
| Hourly Rate | number | Positive, max 9999 | Yes |
| Overtime Threshold | number | 0–168 hours | Yes |
| Overtime Multiplier | number | 1–5 | Yes |

**Acceptance Criteria:**
- [ ] All active janitors and supervisors are listed
- [ ] Employees without custom settings show defaults ($15/hr, 40hrs, 1.5x) in muted text with "(default)" badge
- [ ] Editing a rate saves via upsert — works for first-time set and updates
- [ ] Rates persist after page refresh

#### 5.8.2 Generate Payroll Run

| Field | Type | Validation | Required |
|---|---|---|---|
| Period Start | date | YYYY-MM-DD | Yes |
| Period End | date | YYYY-MM-DD, >= start | Yes |
| Notes | textarea | Max 500 chars | No |

**Acceptance Criteria:**
- [ ] Payroll calculates from actual clock-in/out attendance records
- [ ] Calculation: `regularHours = min(total, threshold)`, `overtimeHours = max(0, total - threshold)`, `grossPay = (regular × rate) + (overtime × rate × multiplier)`
- [ ] Employees with no attendance data show 0 hours and $0 pay
- [ ] Run is created in "Draft" status
- [ ] Redirects to run detail page

#### 5.8.3 Run Detail

**Acceptance Criteria:**
- [ ] Shows summary cards: total gross pay, total hours, overtime hours, employee count
- [ ] Line items table shows per-employee breakdown
- [ ] "Approve" button locks the run (status changes to "Approved")
- [ ] Approved runs cannot be deleted
- [ ] Draft runs can be deleted (with confirmation dialog)
- [ ] "Export CSV" downloads a file with correct data
- [ ] Totals row sums correctly

---

### 5.9 Billing

**URL:** `/{org}/admin/billing`

**Acceptance Criteria:**
- [ ] Current plan is displayed with usage metrics
- [ ] Free plan shows upgrade cards for Pro and Enterprise
- [ ] Monthly and yearly pricing options are available (yearly saves 17%)
- [ ] Clicking upgrade redirects to Stripe Checkout
- [ ] After successful checkout, plan updates in the app
- [ ] "Manage Subscription" opens Stripe Customer Portal
- [ ] Plan limits are enforced immediately after downgrade

---

### 5.10 Onboarding Wizard

**URL:** `/{org}/admin/onboarding`

**Steps:**
1. Welcome (overview of setup)
2. Create first building (name, address — auto-creates ground floor)
3. Invite first team member (name, email, role)
4. Review & finish (shows completion status, links to dashboard)

**Acceptance Criteria:**
- [ ] Each step can be completed or skipped
- [ ] Building created in step 2 appears in buildings list
- [ ] User invited in step 3 receives email
- [ ] Free plan users see upgrade prompt on the finish step
- [ ] "Go to Dashboard" redirects correctly

---

## 6. Supervisor Flows

### 6.1 Dashboard

**URL:** `/{org}/supervisor/dashboard`

**Acceptance Criteria:**
- [ ] Shows today's activities for assigned buildings only
- [ ] Shows team attendance (who clocked in today)
- [ ] Shows inspection counts and pending rooms
- [ ] Shows assigned buildings with room counts

---

### 6.2 Activities

#### 6.2.1 Create Activity

**URL:** `/{org}/supervisor/activities/new`

| Field | Type | Validation | Required |
|---|---|---|---|
| Floor | select | Must be in assigned building | Yes |
| Activity Name | text | 1–100 chars | Yes |
| Scheduled Date | date | YYYY-MM-DD | Yes |
| Window Start | time | HH:MM | Yes |
| Window End | time | HH:MM | Yes |
| Notes | textarea | Max 500 chars | No |

**Acceptance Criteria:**
- [ ] Activity is created in "Draft" status
- [ ] Room tasks are auto-created for all active rooms on the selected floor
- [ ] Janitors can be assigned to room tasks individually or in bulk
- [ ] Activity can be published (status → "Active")
- [ ] Published activity is visible to assigned janitors in their "Today" view
- [ ] Activity can be cancelled
- [ ] Activity can be closed after completion
- [ ] Draft activities can be deleted

#### 6.2.2 Room Task Inspection

**Acceptance Criteria:**
- [ ] Supervisor can mark a room task as passed or failed with notes
- [ ] Pass/fail affects the activity's overall pass rate calculation
- [ ] Failed inspection can trigger deficiency creation

---

### 6.3 Inspections

**URL:** `/{org}/supervisor/inspections`

**Acceptance Criteria:**
- [ ] Inspection can be created for a room in an assigned building
- [ ] QR code scanning opens the room's inspection checklist
- [ ] Each checklist item can be marked completed with optional notes and photos
- [ ] Overall result (pass/fail) is recorded
- [ ] Room must be scanned before checklist can be completed
- [ ] Pass rate is calculated from checklist completion percentage vs. org threshold

---

### 6.4 Activity Templates

**URL:** `/{org}/supervisor/templates`

| Field | Type | Validation | Required |
|---|---|---|---|
| Template Name | text | 1–100 chars | Yes |
| Floor | select | UUID | Yes |
| Window Start/End | time | HH:MM | Yes |
| Is Recurring | boolean | | No |
| Recurrence Days | multi-select | Mon–Sun (min 1 if recurring) | If recurring |
| Time Slots | array | min 1 if recurring | If recurring |

**Acceptance Criteria:**
- [ ] Templates can be created, edited, deleted
- [ ] Recurring templates auto-generate activities on scheduled days
- [ ] Recurring can be toggled active/inactive
- [ ] An existing activity can be saved as a template

---

### 6.5 One-Off Tasks

**URL:** `/{org}/supervisor/tasks`

| Field | Type | Validation | Required |
|---|---|---|---|
| Title | text | 1–200 chars | Yes |
| Description | textarea | Max 2000 chars | No |
| Due Date | date | YYYY-MM-DD | Yes |
| Due Time | time | HH:MM | No |
| Assigned To | select | Active janitor | Yes |
| Image | file | Optional reference photo | No |

**Acceptance Criteria:**
- [ ] Task appears in the assigned janitor's "Today" view on the due date
- [ ] Janitor can mark it as done
- [ ] Supervisor can delete the task

---

### 6.6 Issues / Deficiencies

**URL:** `/{org}/supervisor/issues`

| Field | Type | Validation | Required |
|---|---|---|---|
| Description | text | 1–500 chars | Yes |
| Severity | select | low / medium / high | Yes |
| Assigned To | select | Janitor (optional) | No |

**Acceptance Criteria:**
- [ ] Issues can be created from inspection failures or standalone
- [ ] Status workflow: open → in progress → resolved
- [ ] SLA timer starts based on severity (high: 24h, medium: 48h, low: 168h)
- [ ] Resolution requires a note
- [ ] Issues are visible in the client portal for the associated building

---

### 6.7 Attendance

**URL:** `/{org}/supervisor/attendance`

**Acceptance Criteria:**
- [ ] Shows today's attendance for assigned buildings
- [ ] Each record shows: janitor name, clock-in time, GPS verified status
- [ ] Historical attendance can be filtered by date

---

### 6.8 Reports

**URL:** `/{org}/supervisor/reports/generate`

**Acceptance Criteria:**
- [ ] Same as admin reports but scoped to supervisor's assigned buildings
- [ ] AI summary available on Pro/Enterprise only

---

## 7. Janitor Flows

### 7.1 Clock In

**URL:** `/{org}/janitor/today` (or via QR scan of building)

**Acceptance Criteria:**
- [ ] Janitor must clock in before seeing tasks
- [ ] Clock-in captures GPS coordinates
- [ ] If within geofence radius (default 150m), record is marked "verified"
- [ ] If outside geofence, record is marked "unverified" (still allowed)
- [ ] If GPS permission denied, clock-in still works but geo_verified = false
- [ ] Cannot clock in twice on the same day for the same building
- [ ] Clock-in time is recorded as a timestamp

---

### 7.2 Today's Tasks

**URL:** `/{org}/janitor/today`

**Acceptance Criteria:**
- [ ] Only shows tasks for today (scheduled_date = today, activity status = active)
- [ ] Each task shows: room name, building, floor
- [ ] Tapping a task opens the room's checklist
- [ ] Checklist items can be completed with optional notes and photos
- [ ] After all items, task can be marked "Done" or "Has Issues"
- [ ] One-off (ad-hoc) tasks also appear in the today view

---

### 7.3 Issue Reporting

**Acceptance Criteria:**
- [ ] Janitor can report an issue from within a task or standalone
- [ ] Fields: room, description (1–500 chars), severity (low/medium/high)
- [ ] Issue is created with the janitor as the reporter
- [ ] Supervisor is notified

---

### 7.4 Clock Out

**Acceptance Criteria:**
- [ ] Clock-out records the timestamp
- [ ] Duration is calculated (clock_out - clock_in)
- [ ] Hours feed into reports and payroll calculations

---

### 7.5 Attendance History

**URL:** `/{org}/janitor/attendance`

**Acceptance Criteria:**
- [ ] Shows past clock-in/out records
- [ ] Each record shows: date, building, clock-in time, clock-out time, duration, GPS status

---

## 8. Client Flows

### 8.1 Overview

**URL:** `/{org}/client/overview`

**Acceptance Criteria:**
- [ ] Shows only buildings linked to this client
- [ ] Displays: building count, activity count, pass rate, open issues
- [ ] SLA compliance metrics: pass rate target adherence, avg completion rate, avg resolution time
- [ ] SLA status indicators: on-track, at-risk, breached

---

### 8.2 Activities

**URL:** `/{org}/client/activities`

**Acceptance Criteria:**
- [ ] Shows cleaning activities at client's buildings (read-only)
- [ ] Displays pass rate, room completion count, date

---

### 8.3 Issues

**URL:** `/{org}/client/issues`

**Acceptance Criteria:**
- [ ] Shows open/in-progress/resolved issues at client's buildings
- [ ] Client cannot create, edit, or resolve issues
- [ ] Severity and status are visible

---

### 8.4 Data Isolation

**Acceptance Criteria:**
- [ ] Client cannot see other clients' buildings or data
- [ ] Client cannot see payroll, billing, user management, or internal reports
- [ ] Client cannot create or modify any resources

---

## 9. Platform Admin Flows

**URL:** `/platform` (requires `is_super_admin = true`)

### 9.1 Organisations

**URL:** `/platform/orgs`

**Acceptance Criteria:**
- [ ] Lists all organisations across the platform
- [ ] Each org shows: name, slug, plan, created date

### 9.2 Organisation Detail

**URL:** `/platform/orgs/{id}`

**Acceptance Criteria:**
- [ ] Can change org plan (free / pro / enterprise) with optional note
- [ ] Plan change is logged in audit trail
- [ ] Can suspend org with reason — suspended orgs' users cannot access the app
- [ ] Can unsuspend org
- [ ] Can delete org — confirmation requires typing the org name
- [ ] Deletion cascades: removes all users (auth + public), buildings, activities, and all related data
- [ ] Org disappears from the list immediately after deletion
- [ ] All actions are logged in the platform audit log

### 9.3 Subscriptions

**URL:** `/platform/subscriptions`

**Acceptance Criteria:**
- [ ] Shows all active subscriptions with org name and plan

### 9.4 Usage

**URL:** `/platform/usage`

**Acceptance Criteria:**
- [ ] Shows total AI vectorisation calls, AI report generations, API calls
- [ ] Broken down by organisation

---

## 10. QR Scanning (Public)

### 10.1 Room QR Scan

**URL:** `/scan/{roomId}`

**Acceptance Criteria:**
- [ ] Unauthenticated: shows room info and login link
- [ ] Janitor with task today: auto-checks into the room task
- [ ] Supervisor/Admin: creates inspection for the room
- [ ] Wrong org: access denied
- [ ] Invalid room ID: 404

### 10.2 Building QR Scan

**URL:** `/scan/building/{buildingId}`

**Acceptance Criteria:**
- [ ] Unauthenticated: shows building info and login link
- [ ] Janitor: shows clock-in form with GPS verification
- [ ] Wrong org: access denied
- [ ] Invalid building ID: 404

---

## 11. Plan Gating Matrix

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Buildings | 1 | Unlimited | Unlimited |
| Team Members | 5 | Unlimited | Unlimited |
| Activities & Inspections | Unlimited | Unlimited | Unlimited |
| GPS Attendance | Yes | Yes | Yes |
| Reports (non-AI) | Yes | Yes | Yes |
| Client Portal | Yes | Yes | Yes |
| Payroll | Yes | Yes | Yes |
| AI Floor Plan Vectorisation | No | Yes | Yes |
| AI Report Summaries | No | Yes | Yes |
| REST API Access | No | No | Yes |

**Test scenarios for plan limits:**
- [ ] Free plan: create 1 building (succeeds), attempt 2nd building (blocked with upgrade prompt)
- [ ] Free plan: invite 5 users (succeeds), attempt 6th (blocked with upgrade prompt)
- [ ] Free plan: attempt AI vectorisation (blocked with upgrade message)
- [ ] Free plan: generate report without AI summary (succeeds)
- [ ] Pro plan: all building/user limits removed
- [ ] Pro plan: AI vectorisation and AI reports work
- [ ] Enterprise plan: API endpoints return data with valid API key

---

## 12. Validation Rules Reference

### Password Requirements
| Context | Min Length | Uppercase | Lowercase | Digit |
|---|---|---|---|---|
| Login | 6 | No | No | No |
| Registration | 8 | Yes | Yes | Yes |
| Set Password (invite/reset) | 8 | Yes | Yes | Yes |
| Change Password | 8 | Yes | Yes | Yes |

### Common Field Limits
| Field | Min | Max | Type |
|---|---|---|---|
| Organisation Name | 2 | 100 | text |
| First / Last Name | 1 | 50 | text |
| Building Name | 1 | 100 | text |
| Address | 1 | 200 | text |
| Activity Name | 1 | 100 | text |
| Description / Notes | 0 | 500 | text |
| Checklist Item | 1 | 200 | text |
| Ad-hoc Task Title | 1 | 200 | text |
| Ad-hoc Task Description | 0 | 2000 | text |
| Payroll Notes | 0 | 500 | text |
| Hourly Rate | 0.01 | 9999 | number |
| OT Threshold | 0 | 168 | number |
| OT Multiplier | 1 | 5 | number |
| Geofence Radius | 10 | 5000 | metres |
| Latitude | -90 | 90 | number |
| Longitude | -180 | 180 | number |
| Pass Threshold | 0 | 100 | integer |
| Room Pin X/Y | 0 | 100 | number |

### File Upload Limits
| Upload | Formats | Max Size |
|---|---|---|
| Floor Plan | JPEG, PNG, WebP, PDF | 10 MB |
| Org Logo | JPEG, PNG, WebP, SVG | 2 MB |
| Avatar | JPEG, PNG, WebP | 2 MB |
| Task/Inspection Photo | JPEG, PNG, WebP | 2 MB |
| Ad-hoc Task Image | JPEG, PNG, WebP | 2 MB |

---

## 13. Security Test Scenarios

### 13.1 Organisation Isolation

- [ ] User A (Org 1) cannot see buildings, users, or data from Org 2
- [ ] API queries scoped by org_id at database level (row-level security)
- [ ] Manually crafting URLs with another org's slug returns 404 or redirect

### 13.2 Role-Based Access

- [ ] Janitor cannot access admin routes (`/{org}/admin/*` returns 404)
- [ ] Client cannot access supervisor routes
- [ ] Supervisor cannot access admin-only features (billing, users, settings)
- [ ] Supervisor can only see buildings they are assigned to
- [ ] Janitor can only see their own assigned tasks

### 13.3 Email Enumeration Prevention

- [ ] Password reset always shows success message regardless of email validity
- [ ] Registration error for duplicate email does not confirm email existence (generic error)

### 13.4 Session Security

- [ ] Expired sessions redirect to login
- [ ] Deactivated users are signed out and cannot re-login
- [ ] Suspended organisations' users cannot access the app

### 13.5 Data Integrity

- [ ] Deleting a building cascades to floors, rooms, and related data
- [ ] Deleting a client unlinks buildings but does not delete them
- [ ] Approved payroll runs cannot be deleted
- [ ] Closed/cancelled activities cannot be edited

### 13.6 GPS Verification

- [ ] Clock-in records GPS coordinates when available
- [ ] Geofence check: within radius = verified, outside = unverified
- [ ] GPS permission denied: clock-in still works, geo_verified = false
- [ ] Distance calculation uses haversine formula

---

## 14. Recommended Test Paths

### Path A: Admin Full Onboarding (Priority: High)

1. Register a new organisation
2. Complete onboarding wizard (building + invite)
3. Add floors and rooms to the building
4. Upload floor plan and run AI detection (Pro plan)
5. Create checklist template and set as default
6. Invite a supervisor, janitor, and client
7. Assign supervisor to the building
8. Update settings (pass threshold, logo)
9. View billing and upgrade plan

### Path B: Supervisor Daily Operations (Priority: High)

1. Log in as supervisor
2. Create an activity for today
3. Assign janitors to rooms
4. Publish the activity
5. Create a one-off ad-hoc task
6. Run an inspection (scan QR, complete checklist)
7. Record a pass and a fail
8. Create a deficiency from the failed inspection
9. View attendance dashboard
10. Generate a report

### Path C: Janitor Shift (Priority: High)

1. Scan building QR code to clock in
2. Verify GPS verification status
3. View today's tasks
4. Scan room QR to start a task
5. Complete checklist items (with photos on required items)
6. Mark task as done
7. Report an issue on a different room
8. Complete an ad-hoc task
9. Clock out
10. View attendance history

### Path D: Client Portal (Priority: Medium)

1. Log in as client
2. View building overview and SLA metrics
3. View recent activities and pass rates
4. View open issues
5. Confirm client cannot create or modify anything
6. Confirm client cannot see other clients' data

### Path E: Payroll End-to-End (Priority: Medium)

1. Set pay rates for 3 employees (different rates, thresholds)
2. Ensure attendance records exist for a date range
3. Generate payroll run for that period
4. Verify calculations: regular hours, overtime, gross pay
5. Verify employee with no attendance shows $0
6. Export CSV and verify data matches UI
7. Approve the run
8. Confirm approved run cannot be deleted
9. Generate another draft run and delete it

### Path F: Platform Admin (Priority: Low)

1. Log in as super admin
2. View orgs list
3. Change an org's plan
4. Suspend an org — verify its users cannot log in
5. Unsuspend the org — verify access restored
6. Delete a test org — verify it disappears and all data is removed
7. View usage stats

### Path G: Edge Cases & Negative Testing (Priority: Medium)

1. Submit all forms with empty required fields — verify validation messages
2. Submit with values exceeding max lengths
3. Attempt to access another org's data via URL manipulation
4. Upload oversized files (>10 MB floor plan, >2 MB logo)
5. Upload unsupported file types
6. Clock in twice on the same day — verify error
7. Try to delete an approved payroll run — verify it's blocked
8. Try to edit a closed activity — verify it's blocked
9. Navigate as a deactivated user — verify redirect to login
10. Test in Spanish and French — verify all labels translate

---

## Appendix: Key File References

| Area | Server Action | Validation Schema |
|---|---|---|
| Auth | `actions/auth.ts` | `lib/validations/auth.ts` |
| Registration | `actions/register.ts` | `lib/validations/register.ts` |
| Users | `actions/users.ts` | `lib/validations/user.ts` |
| Buildings | `actions/buildings.ts` | `lib/validations/building.ts` |
| Rooms | `actions/rooms.ts` | `lib/validations/room.ts` |
| Clients | `actions/clients.ts` | `lib/validations/client.ts` |
| Checklists | `actions/checklists.ts` | `lib/validations/checklist.ts` |
| Activities | `actions/activities.ts` | `lib/validations/activity.ts` |
| Inspections | `actions/inspections.ts` | `lib/validations/inspection.ts` |
| Attendance | `actions/attendance.ts` | `lib/validations/attendance.ts` |
| Deficiencies | `actions/deficiencies.ts` | `lib/validations/deficiency.ts` |
| Task Responses | `actions/task-responses.ts` | `lib/validations/task-response.ts` |
| Ad-Hoc Tasks | `actions/adhoc-tasks.ts` | `lib/validations/adhoc-task.ts` |
| Templates | `actions/activity-templates.ts` | `lib/validations/activity-template.ts` |
| Payroll | `actions/payroll.ts` | `lib/validations/payroll.ts` |
| Billing | `actions/billing.ts` | `lib/validations/billing.ts` |
| Reports | `actions/reports.ts` | — |
| Vectorisation | `actions/vectorisation.ts` | `lib/validations/vectorisation.ts` |
| Profile | `actions/profile.ts` | `lib/validations/profile.ts` |
| Settings | `actions/settings.ts` | `lib/validations/settings.ts` |
| Platform | `actions/platform.ts` | Inline Zod schemas |
