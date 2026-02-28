-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organisations(id),
  user_id    uuid NOT NULL REFERENCES users(id),
  type       text NOT NULL,  -- 'activity_published', 'inspection_pass', 'inspection_fail', 'deficiency_assigned', 'deficiency_resolved'
  title      text NOT NULL,
  body       text,
  link       text,           -- relative URL to navigate to
  is_read    boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "user_read_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users can update (mark read) their own notifications
CREATE POLICY "user_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Server-side insert (admin/supervisor roles create notifications for others)
CREATE POLICY "org_insert" ON notifications
  FOR INSERT WITH CHECK (org_id = auth_org_id());
