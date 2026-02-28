-- Activity Templates: reusable activity configurations
CREATE TABLE IF NOT EXISTS activity_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organisations(id),
  created_by  uuid NOT NULL REFERENCES users(id),
  name        text NOT NULL,
  floor_id    uuid NOT NULL REFERENCES floors(id),
  window_start time NOT NULL DEFAULT '08:00',
  window_end   time NOT NULL DEFAULT '17:00',
  notes       text,
  default_assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_org_id ON activity_templates (org_id);

-- RLS
ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON activity_templates
  USING (org_id = auth_org_id());

CREATE POLICY "supervisor_insert" ON activity_templates
  FOR INSERT WITH CHECK (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "supervisor_update" ON activity_templates
  FOR UPDATE USING (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "supervisor_delete" ON activity_templates
  FOR DELETE USING (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );
