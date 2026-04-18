-- Migration: 00031_payroll_run_lines.sql
-- Per-employee line items within a payroll run

CREATE TABLE payroll_run_lines (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id      uuid NOT NULL REFERENCES payroll_runs (id) ON DELETE CASCADE,
  org_id              uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  employee_name       text NOT NULL,
  hourly_rate         numeric(10,2) NOT NULL,
  total_hours         numeric(7,2) NOT NULL DEFAULT 0,
  regular_hours       numeric(7,2) NOT NULL DEFAULT 0,
  overtime_hours      numeric(7,2) NOT NULL DEFAULT 0,
  overtime_multiplier numeric(3,2) NOT NULL DEFAULT 1.50,
  regular_pay         numeric(12,2) NOT NULL DEFAULT 0,
  overtime_pay        numeric(12,2) NOT NULL DEFAULT 0,
  gross_pay           numeric(12,2) NOT NULL DEFAULT 0,
  shifts              integer NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payroll_lines_run ON payroll_run_lines (payroll_run_id);
CREATE INDEX idx_payroll_lines_user ON payroll_run_lines (user_id);

ALTER TABLE payroll_run_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payroll_run_lines"
  ON payroll_run_lines FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can insert payroll_run_lines"
  ON payroll_run_lines FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can delete payroll_run_lines"
  ON payroll_run_lines FOR DELETE
  USING (org_id = auth_org_id() AND auth_role() = 'admin');
