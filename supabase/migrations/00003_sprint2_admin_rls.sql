-- Migration: 00003_sprint2_admin_rls.sql
-- Sprint 2: updated_at columns, admin UPDATE policy, storage bucket

-- ============================================
-- 1. Shared updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Add updated_at to organisations
-- ============================================
ALTER TABLE organisations
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER set_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 3. Add updated_at to users
-- ============================================
ALTER TABLE users
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. RLS: Admin can update own organisation
-- ============================================
CREATE POLICY "Admins can update own organisation"
  ON organisations FOR UPDATE
  USING (id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- 5. Storage bucket for org assets
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-assets', 'org-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload org assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-assets'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Admins can update org assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-assets'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Anyone can read org assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-assets');
