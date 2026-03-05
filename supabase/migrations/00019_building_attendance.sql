-- Migration: 00019_building_attendance.sql
-- Building-level attendance tracking with geolocation verification

-- ============================================
-- ALTER TABLE: buildings — add location + QR columns
-- ============================================
ALTER TABLE buildings
  ADD COLUMN latitude double precision,
  ADD COLUMN longitude double precision,
  ADD COLUMN geofence_radius_m integer NOT NULL DEFAULT 150,
  ADD COLUMN attendance_qr_path text;

-- ============================================
-- TABLE: attendance_records
-- ============================================
CREATE TABLE attendance_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  building_id     uuid NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  clock_in_at     timestamptz NOT NULL DEFAULT now(),
  clock_out_at    timestamptz,
  scan_latitude   double precision,
  scan_longitude  double precision,
  distance_m      double precision,
  geo_verified    boolean NOT NULL DEFAULT false,
  geo_error       text,
  date            date NOT NULL DEFAULT CURRENT_DATE,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_attendance_org_date ON attendance_records (org_id, date);
CREATE INDEX idx_attendance_user_date ON attendance_records (user_id, date);
CREATE INDEX idx_attendance_building_date ON attendance_records (building_id, date);

-- Prevent double clock-in (same user, same building, same day, still open)
CREATE UNIQUE INDEX idx_attendance_no_double_clockin
  ON attendance_records (user_id, building_id, date)
  WHERE clock_out_at IS NULL;

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: attendance_records
-- ============================================

-- All org members can read attendance records
CREATE POLICY "Org members can read attendance"
  ON attendance_records FOR SELECT
  USING (org_id = auth_org_id());

-- Janitors can insert their own attendance records
CREATE POLICY "Janitors can clock in"
  ON attendance_records FOR INSERT
  WITH CHECK (
    org_id = auth_org_id()
    AND user_id = (auth.uid())
    AND auth_role() = 'janitor'
  );

-- Janitors can update their own records (clock out)
CREATE POLICY "Janitors can clock out"
  ON attendance_records FOR UPDATE
  USING (
    org_id = auth_org_id()
    AND user_id = (auth.uid())
    AND auth_role() = 'janitor'
  )
  WITH CHECK (
    org_id = auth_org_id()
    AND user_id = (auth.uid())
  );
