-- Migration: 00029_payroll_settings.sql
-- Per-employee pay configuration (hourly rate, overtime rules)

CREATE TABLE payroll_settings (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  user_id                  uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  hourly_rate              numeric(10,2) NOT NULL DEFAULT 15.00,
  overtime_threshold_hours numeric(5,2) NOT NULL DEFAULT 40.00,
  overtime_multiplier      numeric(3,2) NOT NULL DEFAULT 1.50,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_payroll_settings_org ON payroll_settings (org_id);
CREATE INDEX idx_payroll_settings_user ON payroll_settings (user_id);

ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payroll_settings"
  ON payroll_settings FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can insert payroll_settings"
  ON payroll_settings FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update payroll_settings"
  ON payroll_settings FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can delete payroll_settings"
  ON payroll_settings FOR DELETE
  USING (org_id = auth_org_id() AND auth_role() = 'admin');
