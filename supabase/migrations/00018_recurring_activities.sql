-- Recurring schedule fields on activity_templates
ALTER TABLE activity_templates
  ADD COLUMN is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN recurrence_days text[] NOT NULL DEFAULT '{}',
  ADD COLUMN time_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN recurrence_preset text,
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN last_generated_date date;

-- Back-reference from activities to their source template
ALTER TABLE cleaning_activities
  ADD COLUMN source_template_id uuid REFERENCES activity_templates(id) ON DELETE SET NULL;

-- Index for the cron query: find active recurring templates
CREATE INDEX idx_templates_recurring
  ON activity_templates (is_recurring, is_active)
  WHERE is_recurring = true AND is_active = true;

-- Index for idempotency: find activities from a template on a given date
CREATE INDEX idx_activities_source_template_date
  ON cleaning_activities (source_template_id, scheduled_date)
  WHERE source_template_id IS NOT NULL;
