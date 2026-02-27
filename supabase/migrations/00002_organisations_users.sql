-- Migration: 00002_organisations_users.sql
-- Create organisations and users tables, RLS helpers, policies, and metadata sync trigger

-- ============================================
-- TABLE: organisations
-- ============================================
CREATE TABLE organisations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  logo_url      text,
  pass_threshold integer NOT NULL DEFAULT 80,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organisations_slug ON organisations (slug);

ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLE: users (extends auth.users)
-- ============================================
CREATE TABLE users (
  id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  org_id      uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  role        user_role NOT NULL,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org_id ON users (org_id);
CREATE INDEX idx_users_role ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION auth_org_id() RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT auth.jwt() -> 'app_metadata' ->> 'role'
$$ LANGUAGE sql STABLE;

-- ============================================
-- RLS POLICIES: organisations
-- ============================================

CREATE POLICY "Users can read own organisation"
  ON organisations FOR SELECT
  USING (id = auth_org_id());

-- ============================================
-- RLS POLICIES: users
-- ============================================

CREATE POLICY "Users can read org members"
  ON users FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    org_id = auth_org_id()
  );

-- ============================================
-- TRIGGER: Sync user metadata to auth.users.app_metadata
-- ============================================

CREATE OR REPLACE FUNCTION sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role',     NEW.role::text,
      'org_id',   NEW.org_id::text,
      'org_slug', (SELECT slug FROM organisations WHERE id = NEW.org_id)
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_upsert
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_metadata();
