-- Fix: Make seed functions idempotent so they can be called safely
-- even if triggers already ran or data partially exists.

-- ============================================
-- 0. Add unique constraint on room_types (org_id, name)
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_room_types_org_name
  ON room_types (org_id, name);

-- ============================================
-- 1. Idempotent room types seed
-- ============================================
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
    (p_org_id, 'Storage',      true)
  ON CONFLICT DO NOTHING;
END;
$$;

-- ============================================
-- 2. Idempotent checklists seed
-- ============================================
CREATE OR REPLACE FUNCTION seed_default_checklists(p_org_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  rt RECORD;
  tpl_id uuid;
  existing_id uuid;
BEGIN
  -- Bathroom
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Bathroom' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
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
  END IF;

  -- Office
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Office' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
      INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
      VALUES (p_org_id, rt.id, 'Standard Office Clean', true) RETURNING id INTO tpl_id;
      INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
        (tpl_id, p_org_id, 'Dust all surfaces and shelves', 1),
        (tpl_id, p_org_id, 'Vacuum carpet or mop hard floors', 2),
        (tpl_id, p_org_id, 'Wipe desks and work surfaces', 3),
        (tpl_id, p_org_id, 'Clean glass partitions', 4),
        (tpl_id, p_org_id, 'Empty trash bins', 5);
    END IF;
  END IF;

  -- Kitchen
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Kitchen' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
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
  END IF;

  -- Meeting Room
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Meeting Room' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
      INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
      VALUES (p_org_id, rt.id, 'Standard Meeting Room Clean', true) RETURNING id INTO tpl_id;
      INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
        (tpl_id, p_org_id, 'Wipe conference table', 1),
        (tpl_id, p_org_id, 'Clean whiteboard', 2),
        (tpl_id, p_org_id, 'Dust chairs and surfaces', 3),
        (tpl_id, p_org_id, 'Vacuum floor', 4),
        (tpl_id, p_org_id, 'Empty trash bins', 5);
    END IF;
  END IF;

  -- Lobby
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Lobby' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
      INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
      VALUES (p_org_id, rt.id, 'Standard Lobby Clean', true) RETURNING id INTO tpl_id;
      INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
        (tpl_id, p_org_id, 'Vacuum or mop floor', 1),
        (tpl_id, p_org_id, 'Clean entrance glass doors', 2),
        (tpl_id, p_org_id, 'Wipe reception desk', 3),
        (tpl_id, p_org_id, 'Dust seating area', 4),
        (tpl_id, p_org_id, 'Empty trash bins', 5);
    END IF;
  END IF;

  -- Stairwell
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Stairwell' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
      INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
      VALUES (p_org_id, rt.id, 'Standard Stairwell Clean', true) RETURNING id INTO tpl_id;
      INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
        (tpl_id, p_org_id, 'Sweep stairs and landings', 1),
        (tpl_id, p_org_id, 'Mop hard surfaces', 2),
        (tpl_id, p_org_id, 'Wipe handrails', 3),
        (tpl_id, p_org_id, 'Remove cobwebs', 4);
    END IF;
  END IF;

  -- Storage
  SELECT id INTO rt FROM room_types WHERE org_id = p_org_id AND name = 'Storage' LIMIT 1;
  IF rt.id IS NOT NULL THEN
    SELECT id INTO existing_id FROM checklist_templates WHERE org_id = p_org_id AND room_type_id = rt.id AND is_default = true;
    IF existing_id IS NULL THEN
      INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
      VALUES (p_org_id, rt.id, 'Standard Storage Clean', true) RETURNING id INTO tpl_id;
      INSERT INTO checklist_items (template_id, org_id, description, item_order) VALUES
        (tpl_id, p_org_id, 'Sweep floor', 1),
        (tpl_id, p_org_id, 'Dust shelving units', 2),
        (tpl_id, p_org_id, 'Organise supplies', 3),
        (tpl_id, p_org_id, 'Remove any debris', 4);
    END IF;
  END IF;
END;
$$;
