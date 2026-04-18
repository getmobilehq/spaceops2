-- Migration: 00030_payroll_runs.sql
-- Payroll runs — generated payroll for a date range

CREATE TABLE payroll_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'approved')),
  total_gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  employee_count  integer NOT NULL DEFAULT 0,
  notes           text,
  created_by      uuid REFERENCES users (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  approved_at     timestamptz,
  approved_by     uuid REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_payroll_runs_org ON payroll_runs (org_id);
CREATE INDEX idx_payroll_runs_period ON payroll_runs (org_id, period_start, period_end);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payroll_runs"
  ON payroll_runs FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can insert payroll_runs"
  ON payroll_runs FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update payroll_runs"
  ON payroll_runs FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can delete payroll_runs"
  ON payroll_runs FOR DELETE
  USING (org_id = auth_org_id() AND auth_role() = 'admin');
