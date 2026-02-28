-- Sprint 9: Deficiency Tracking
-- Tracks issues found during inspection that need to be resolved

CREATE TABLE deficiencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_task_id uuid NOT NULL REFERENCES room_tasks(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organisations(id),
  reported_by uuid NOT NULL REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status deficiency_status NOT NULL DEFAULT 'open',
  photo_url text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id),
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deficiencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage deficiencies"
  ON deficiencies FOR ALL
  USING (org_id = auth_org_id());

CREATE TRIGGER set_deficiencies_updated_at
  BEFORE UPDATE ON deficiencies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_deficiencies_room_task ON deficiencies (room_task_id);
CREATE INDEX idx_deficiencies_org_status ON deficiencies (org_id, status);
CREATE INDEX idx_deficiencies_assigned ON deficiencies (assigned_to, status);
