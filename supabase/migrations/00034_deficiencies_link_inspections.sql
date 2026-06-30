-- Standalone inspections (00024) record a pass/fail on a room with no associated
-- room_task. A failed standalone inspection must still raise a deficiency so it
-- shows on the supervisor's Issues dashboard (UAT 06.52), but deficiencies.room_task_id
-- was NOT NULL, making that impossible. Relax it and add a direct inspection link.

-- 1. room_task_id becomes optional (activity-tied deficiencies still set it).
ALTER TABLE deficiencies ALTER COLUMN room_task_id DROP NOT NULL;

-- 2. Link a deficiency directly to the inspection that raised it.
ALTER TABLE deficiencies
  ADD COLUMN inspection_id uuid REFERENCES inspections (id) ON DELETE CASCADE;

-- 3. Every deficiency must originate from exactly one source: a room task or an
--    inspection. Guards against orphan rows with neither link.
ALTER TABLE deficiencies
  ADD CONSTRAINT deficiencies_source_chk
  CHECK (num_nonnulls(room_task_id, inspection_id) = 1);

CREATE INDEX idx_deficiencies_inspection ON deficiencies (inspection_id);
