-- Phase 3: API key management and usage event tracking

-- ============================================
-- 1. API Keys table
-- ============================================
CREATE TABLE api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  name         text NOT NULL,
  key_prefix   text NOT NULL,
  key_hash     text NOT NULL UNIQUE,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  revoked_at   timestamptz
);

CREATE INDEX idx_api_keys_org_id ON api_keys (org_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read org api keys"
  ON api_keys FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can create org api keys"
  ON api_keys FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update org api keys"
  ON api_keys FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- 2. Usage Events table
-- ============================================
CREATE TABLE usage_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata   jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_org_id ON usage_events (org_id);
CREATE INDEX idx_usage_events_org_month ON usage_events (org_id, event_type, created_at);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read org usage events"
  ON usage_events FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');
