-- Migration: 00024_standalone_inspections.sql
-- Standalone inspections independent of cleaning activities

CREATE TABLE inspections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  building_id     uuid NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  floor_id        uuid NOT NULL REFERENCES floors (id) ON DELETE CASCADE,
  room_id         uuid NOT NULL REFERENCES rooms (id) ON DELETE CASCADE,
  inspector_id    uuid NOT NULL REFERENCES users (id),
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'passed', 'failed')),
  notes           text,
  inspection_scan_at timestamptz,
  inspected_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspections_org ON inspections (org_id);
CREATE INDEX idx_inspections_building ON inspections (building_id);
CREATE INDEX idx_inspections_inspector ON inspections (inspector_id);
CREATE INDEX idx_inspections_created ON inspections (org_id, created_at DESC);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read inspections"
  ON inspections FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));

CREATE POLICY "Supervisors can create inspections"
  ON inspections FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));

CREATE POLICY "Supervisors can update own inspections"
  ON inspections FOR UPDATE
  USING (org_id = auth_org_id() AND inspector_id = auth.uid() AND auth_role() IN ('admin', 'supervisor'));
