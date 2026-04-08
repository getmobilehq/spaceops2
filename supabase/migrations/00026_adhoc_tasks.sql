-- Migration: 00026_adhoc_tasks.sql
-- One-off ad-hoc tasks that supervisors assign to janitors

CREATE TABLE adhoc_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  title         text NOT NULL,
  description   text,
  image_url     text,
  due_date      date NOT NULL,
  due_time      time,
  assigned_to   uuid NOT NULL REFERENCES users (id),
  created_by    uuid NOT NULL REFERENCES users (id),
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'done')),
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_adhoc_tasks_org ON adhoc_tasks (org_id);
CREATE INDEX idx_adhoc_tasks_assigned ON adhoc_tasks (assigned_to, due_date);
CREATE INDEX idx_adhoc_tasks_created_by ON adhoc_tasks (created_by);

ALTER TABLE adhoc_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supervisors can read adhoc_tasks"
  ON adhoc_tasks FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));

CREATE POLICY "Janitors can read own adhoc_tasks"
  ON adhoc_tasks FOR SELECT
  USING (org_id = auth_org_id() AND assigned_to = auth.uid() AND auth_role() = 'janitor');

CREATE POLICY "Supervisors can create adhoc_tasks"
  ON adhoc_tasks FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));

CREATE POLICY "Supervisors can update adhoc_tasks"
  ON adhoc_tasks FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));

CREATE POLICY "Janitors can update own adhoc_tasks"
  ON adhoc_tasks FOR UPDATE
  USING (org_id = auth_org_id() AND assigned_to = auth.uid() AND auth_role() = 'janitor');

CREATE POLICY "Supervisors can delete adhoc_tasks"
  ON adhoc_tasks FOR DELETE
  USING (org_id = auth_org_id() AND auth_role() IN ('admin', 'supervisor'));
