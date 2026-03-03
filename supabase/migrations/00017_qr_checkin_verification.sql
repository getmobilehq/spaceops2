-- Migration: QR code check-in verification
-- Adds timestamps for proof-of-presence: janitor check-in and supervisor inspection scan

ALTER TABLE room_tasks
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS inspection_scan_at timestamptz;
