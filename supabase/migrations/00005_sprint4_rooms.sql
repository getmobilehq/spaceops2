-- Sprint 4: Room Setup & QR Codes
-- Tables: room_types, rooms
-- Storage: qr-codes (public)

-- ============================================================
-- 1. room_types
-- ============================================================
CREATE TABLE room_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON room_types
  FOR ALL USING (org_id = auth_org_id());

-- Seed function for default room types
CREATE OR REPLACE FUNCTION seed_default_room_types(p_org_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO room_types (org_id, name, is_default) VALUES
    (p_org_id, 'Office',       true),
    (p_org_id, 'Bathroom',     true),
    (p_org_id, 'Kitchen',      true),
    (p_org_id, 'Meeting Room', true),
    (p_org_id, 'Lobby',        true),
    (p_org_id, 'Stairwell',    true),
    (p_org_id, 'Storage',      true);
END;
$$;

-- Seed for all existing orgs
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organisations LOOP
    PERFORM seed_default_room_types(org.id);
  END LOOP;
END;
$$;

-- Auto-seed on new org creation
CREATE OR REPLACE FUNCTION trigger_seed_room_types()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM seed_default_room_types(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_seed_room_types
  AFTER INSERT ON organisations
  FOR EACH ROW EXECUTE FUNCTION trigger_seed_room_types();

-- ============================================================
-- 2. rooms
-- ============================================================
CREATE TABLE rooms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id      uuid NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name          text NOT NULL,
  room_type_id  uuid NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
  qr_code_url   text,
  pin_x         double precision,
  pin_y         double precision,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (floor_id, name)
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON rooms
  FOR ALL USING (org_id = auth_org_id());

-- Re-use existing update_updated_at trigger function from Sprint 2
CREATE TRIGGER set_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. Storage: qr-codes (public bucket)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "public_read_qr_codes" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-codes');

-- Authenticated users can upload to their org path
CREATE POLICY "org_upload_qr_codes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'qr-codes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'org_id')
  );

-- Authenticated users can update/delete within their org path
CREATE POLICY "org_manage_qr_codes" ON storage.objects
  FOR ALL USING (
    bucket_id = 'qr-codes'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'org_id')
  );
