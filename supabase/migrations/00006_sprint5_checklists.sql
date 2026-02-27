-- Sprint 5: Checklist Templates
-- Tables: checklist_templates, checklist_items, room_checklist_overrides
-- Seed: default checklists per room type

-- ============================================================
-- 1. checklist_templates
-- ============================================================
CREATE TABLE checklist_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  room_type_id  uuid REFERENCES room_types(id) ON DELETE SET NULL,
  name          text NOT NULL,
  is_default    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON checklist_templates
  FOR ALL USING (org_id = auth_org_id());

CREATE TRIGGER set_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Partial unique index: only one default per (org, room_type)
CREATE UNIQUE INDEX idx_one_default_per_room_type
  ON checklist_templates (org_id, room_type_id)
  WHERE is_default = true;

-- ============================================================
-- 2. checklist_items
-- ============================================================
CREATE TABLE checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  description     text NOT NULL,
  item_order      integer NOT NULL,
  requires_photo  boolean NOT NULL DEFAULT false,
  requires_note   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON checklist_items
  FOR ALL USING (org_id = auth_org_id());

CREATE TRIGGER set_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. room_checklist_overrides
-- ============================================================
CREATE TABLE room_checklist_overrides (
  room_id      uuid PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  template_id  uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE room_checklist_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON room_checklist_overrides
  FOR ALL USING (org_id = auth_org_id());

-- ============================================================
-- 4. Seed default checklists per room type for all existing orgs
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_checklists(p_org_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rt RECORD;
  tpl_id uuid;
BEGIN
  -- Bathroom
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Bathroom' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Bathroom Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Clean and sanitise toilet bowl', 1),
      (tpl_id, p_org_id, 'Wipe mirrors and glass surfaces', 2),
      (tpl_id, p_org_id, 'Clean sink and countertops', 3),
      (tpl_id, p_org_id, 'Mop and disinfect floor', 4),
      (tpl_id, p_org_id, 'Restock soap and paper towels', 5),
      (tpl_id, p_org_id, 'Empty trash bins', 6);
  END IF;

  -- Office
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Office' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Office Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Dust all surfaces and shelves', 1),
      (tpl_id, p_org_id, 'Vacuum carpet or mop hard floors', 2),
      (tpl_id, p_org_id, 'Wipe desks and work surfaces', 3),
      (tpl_id, p_org_id, 'Clean glass partitions', 4),
      (tpl_id, p_org_id, 'Empty trash bins', 5);
  END IF;

  -- Kitchen
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Kitchen' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Kitchen Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Clean countertops and tables', 1),
      (tpl_id, p_org_id, 'Wash and sanitise sink', 2),
      (tpl_id, p_org_id, 'Wipe appliance exteriors', 3),
      (tpl_id, p_org_id, 'Mop floor', 4),
      (tpl_id, p_org_id, 'Restock paper towels', 5),
      (tpl_id, p_org_id, 'Empty trash and recycling', 6);
  END IF;

  -- Meeting Room
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Meeting Room' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Meeting Room Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Wipe conference table', 1),
      (tpl_id, p_org_id, 'Clean whiteboard', 2),
      (tpl_id, p_org_id, 'Dust chairs and surfaces', 3),
      (tpl_id, p_org_id, 'Vacuum floor', 4),
      (tpl_id, p_org_id, 'Empty trash bins', 5);
  END IF;

  -- Lobby
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Lobby' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Lobby Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Vacuum or mop floor', 1),
      (tpl_id, p_org_id, 'Clean entrance glass doors', 2),
      (tpl_id, p_org_id, 'Wipe reception desk', 3),
      (tpl_id, p_org_id, 'Dust seating area', 4),
      (tpl_id, p_org_id, 'Empty trash bins', 5);
  END IF;

  -- Stairwell
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Stairwell' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Stairwell Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Sweep stairs and landings', 1),
      (tpl_id, p_org_id, 'Mop hard surfaces', 2),
      (tpl_id, p_org_id, 'Wipe handrails', 3),
      (tpl_id, p_org_id, 'Remove cobwebs', 4);
  END IF;

  -- Storage
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Storage' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
    VALUES (p_org_id, rt.id, 'Standard Storage Clean', true) RETURNING id INTO tpl_id;
    INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
      (tpl_id, p_org_id, 'Sweep floor', 1),
      (tpl_id, p_org_id, 'Dust shelving units', 2),
      (tpl_id, p_org_id, 'Organise supplies', 3),
      (tpl_id, p_org_id, 'Remove any debris', 4);
  END IF;
END;
$$;

-- Seed for all existing orgs
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organisations LOOP
    PERFORM seed_default_checklists(org.id);
  END LOOP;
END;
$$;

-- Auto-seed on new org creation (extend existing trigger or add new)
CREATE OR REPLACE FUNCTION trigger_seed_checklists()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM seed_default_checklists(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_org_created_seed_checklists
  AFTER INSERT ON organisations
  FOR EACH ROW EXECUTE FUNCTION trigger_seed_checklists();
