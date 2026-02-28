-- Sprint 8: Inspection Flow
-- Adds inspection columns to room_tasks so supervisors can review completed work

ALTER TABLE room_tasks
  ADD COLUMN IF NOT EXISTS inspected_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS inspected_at timestamptz,
  ADD COLUMN IF NOT EXISTS inspection_note text;

CREATE INDEX IF NOT EXISTS idx_room_tasks_inspected_by
  ON room_tasks (inspected_by);
