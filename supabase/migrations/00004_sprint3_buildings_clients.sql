-- Migration: 00004_sprint3_buildings_clients.sql
-- Sprint 3: clients, buildings, floors, building_supervisors, vectorised_plans + storage

-- ============================================
-- TABLE: clients
-- ============================================
CREATE TABLE clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  company_name  text NOT NULL,
  contact_name  text NOT NULL,
  contact_email text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_org_id ON clients (org_id);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read clients"
  ON clients FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert clients"
  ON clients FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update clients"
  ON clients FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- TABLE: buildings
-- ============================================
CREATE TABLE buildings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients (id) ON DELETE SET NULL,
  name        text NOT NULL,
  address     text NOT NULL,
  status      text NOT NULL DEFAULT 'setup'
    CHECK (status IN ('active', 'inactive', 'setup')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_buildings_org_id ON buildings (org_id);
CREATE INDEX idx_buildings_client_id ON buildings (client_id);
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read buildings"
  ON buildings FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert buildings"
  ON buildings FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update buildings"
  ON buildings FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- TABLE: building_supervisors (junction)
-- ============================================
CREATE TABLE building_supervisors (
  building_id uuid NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (building_id, user_id)
);

ALTER TABLE building_supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read building_supervisors"
  ON building_supervisors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = building_supervisors.building_id
        AND buildings.org_id = auth_org_id()
    )
  );

CREATE POLICY "Admins can insert building_supervisors"
  ON building_supervisors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = building_supervisors.building_id
        AND buildings.org_id = auth_org_id()
        AND auth_role() = 'admin'
    )
  );

CREATE POLICY "Admins can delete building_supervisors"
  ON building_supervisors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM buildings
      WHERE buildings.id = building_supervisors.building_id
        AND buildings.org_id = auth_org_id()
        AND auth_role() = 'admin'
    )
  );

-- ============================================
-- TABLE: floors
-- ============================================
CREATE TABLE floors (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id   uuid NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  floor_number  integer NOT NULL,
  floor_name    text NOT NULL,
  plan_status   plan_status NOT NULL DEFAULT 'none',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_floors_building_id ON floors (building_id);
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read floors"
  ON floors FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert floors"
  ON floors FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update floors"
  ON floors FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- TABLE: vectorised_plans (1:1 with floor)
-- ============================================
CREATE TABLE vectorised_plans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id      uuid NOT NULL UNIQUE REFERENCES floors (id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  original_path text NOT NULL,
  svg_path      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vectorised_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read vectorised_plans"
  ON vectorised_plans FOR SELECT
  USING (org_id = auth_org_id());

CREATE POLICY "Admins can insert vectorised_plans"
  ON vectorised_plans FOR INSERT
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

CREATE POLICY "Admins can update vectorised_plans"
  ON vectorised_plans FOR UPDATE
  USING (org_id = auth_org_id() AND auth_role() = 'admin')
  WITH CHECK (org_id = auth_org_id() AND auth_role() = 'admin');

-- ============================================
-- STORAGE: floor-plans bucket (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans', 'floor-plans', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload floor plans"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'floor-plans'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Admins can update floor plans"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'floor-plans'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Org members can read floor plans"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'floor-plans'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- ============================================
-- STORAGE: floor-plans-svg bucket (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-plans-svg', 'floor-plans-svg', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload floor plan SVGs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'floor-plans-svg'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Admins can update floor plan SVGs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'floor-plans-svg'
    AND auth_role() = 'admin'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

CREATE POLICY "Org members can read floor plan SVGs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'floor-plans-svg'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );
