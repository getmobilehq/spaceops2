-- Migration: 00028_platform_admin.sql
-- Org suspension and platform audit log for super admin actions

-- Add suspension columns to organisations
ALTER TABLE organisations
  ADD COLUMN suspended_at timestamptz,
  ADD COLUMN suspended_reason text;

-- Platform audit log for tracking super admin actions
CREATE TABLE platform_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid REFERENCES organisations (id) ON DELETE SET NULL,
  performed_by    uuid REFERENCES users (id) ON DELETE SET NULL,
  action_type     text NOT NULL CHECK (action_type IN (
    'plan_change', 'suspend', 'unsuspend', 'delete'
  )),
  from_value      text,
  to_value        text,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_audit_org ON platform_audit_log (org_id);
CREATE INDEX idx_platform_audit_created ON platform_audit_log (created_at DESC);

ALTER TABLE platform_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can read the audit log
CREATE POLICY "Super admins can read platform audit log"
  ON platform_audit_log FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
  );

-- Only super admins can insert (server actions use admin client which bypasses RLS,
-- but this provides defence in depth)
CREATE POLICY "Super admins can insert platform audit log"
  ON platform_audit_log FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
  );
