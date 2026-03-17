-- Shared Template Library
-- Global checklist templates available to all orgs, plus clone function.

-- ============================================================
-- 1. global_checklist_templates
-- ============================================================
CREATE TABLE global_checklist_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type_name  text NOT NULL,
  name            text NOT NULL,
  description     text,
  category        text NOT NULL DEFAULT 'standard',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE global_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON global_checklist_templates
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 2. global_checklist_items
-- ============================================================
CREATE TABLE global_checklist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES global_checklist_templates(id) ON DELETE CASCADE,
  description     text NOT NULL,
  item_order      integer NOT NULL,
  requires_photo  boolean NOT NULL DEFAULT false,
  requires_note   boolean NOT NULL DEFAULT false
);

ALTER TABLE global_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read" ON global_checklist_items
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- 3. Seed global templates with the same data from seed_default_checklists
-- ============================================================
DO $$
DECLARE
  tpl_id uuid;
BEGIN
  -- Bathroom
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Bathroom', 'Standard Bathroom Clean', 'Complete bathroom cleaning and restocking routine', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Clean and sanitise toilet bowl', 1),
    (tpl_id, 'Wipe mirrors and glass surfaces', 2),
    (tpl_id, 'Clean sink and countertops', 3),
    (tpl_id, 'Mop and disinfect floor', 4),
    (tpl_id, 'Restock soap and paper towels', 5),
    (tpl_id, 'Empty trash bins', 6);

  -- Office
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Office', 'Standard Office Clean', 'Routine office cleaning including dusting and vacuuming', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Dust all surfaces and shelves', 1),
    (tpl_id, 'Vacuum carpet or mop hard floors', 2),
    (tpl_id, 'Wipe desks and work surfaces', 3),
    (tpl_id, 'Clean glass partitions', 4),
    (tpl_id, 'Empty trash bins', 5);

  -- Kitchen
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Kitchen', 'Standard Kitchen Clean', 'Full kitchen cleaning and restocking checklist', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Clean countertops and tables', 1),
    (tpl_id, 'Wash and sanitise sink', 2),
    (tpl_id, 'Wipe appliance exteriors', 3),
    (tpl_id, 'Mop floor', 4),
    (tpl_id, 'Restock paper towels', 5),
    (tpl_id, 'Empty trash and recycling', 6);

  -- Meeting Room
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Meeting Room', 'Standard Meeting Room Clean', 'Meeting room reset and cleaning procedure', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Wipe conference table', 1),
    (tpl_id, 'Clean whiteboard', 2),
    (tpl_id, 'Dust chairs and surfaces', 3),
    (tpl_id, 'Vacuum floor', 4),
    (tpl_id, 'Empty trash bins', 5);

  -- Lobby
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Lobby', 'Standard Lobby Clean', 'Lobby and reception area cleaning routine', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Vacuum or mop floor', 1),
    (tpl_id, 'Clean entrance glass doors', 2),
    (tpl_id, 'Wipe reception desk', 3),
    (tpl_id, 'Dust seating area', 4),
    (tpl_id, 'Empty trash bins', 5);

  -- Stairwell
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Stairwell', 'Standard Stairwell Clean', 'Stairwell sweeping and handrail cleaning', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Sweep stairs and landings', 1),
    (tpl_id, 'Mop hard surfaces', 2),
    (tpl_id, 'Wipe handrails', 3),
    (tpl_id, 'Remove cobwebs', 4);

  -- Storage
  INSERT INTO global_checklist_templates (room_type_name, name, description, category)
  VALUES ('Storage', 'Standard Storage Clean', 'Storage room tidying and floor cleaning', 'standard')
  RETURNING id INTO tpl_id;
  INSERT INTO global_checklist_items (template_id, description, item_order) VALUES
    (tpl_id, 'Sweep floor', 1),
    (tpl_id, 'Dust shelving units', 2),
    (tpl_id, 'Organise supplies', 3),
    (tpl_id, 'Remove any debris', 4);
END;
$$;

-- ============================================================
-- 4. clone_global_template function
-- ============================================================
CREATE OR REPLACE FUNCTION clone_global_template(
  p_global_template_id uuid,
  p_org_id uuid,
  p_room_type_id uuid DEFAULT NULL
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_tpl_id uuid;
  v_tpl RECORD;
BEGIN
  -- Fetch the global template
  SELECT * INTO v_tpl FROM global_checklist_templates WHERE id = p_global_template_id;
  IF v_tpl IS NULL THEN
    RAISE EXCEPTION 'Global template not found';
  END IF;

  -- Create the org-local template
  INSERT INTO checklist_templates (org_id, room_type_id, name, is_default)
  VALUES (p_org_id, p_room_type_id, v_tpl.name, false)
  RETURNING id INTO v_new_tpl_id;

  -- Copy all items
  INSERT INTO checklist_items (template_id, org_id, description, item_order, requires_photo, requires_note)
  SELECT v_new_tpl_id, p_org_id, gi.description, gi.item_order, gi.requires_photo, gi.requires_note
  FROM global_checklist_items gi
  WHERE gi.template_id = p_global_template_id
  ORDER BY gi.item_order;

  RETURN v_new_tpl_id;
END;
$$;

-- ============================================================
-- 5. Replace seed_default_checklists to read from global tables
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_checklists(p_org_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  gt RECORD;
  rt_id uuid;
  existing_id uuid;
BEGIN
  FOR gt IN SELECT id, room_type_name FROM global_checklist_templates ORDER BY room_type_name
  LOOP
    -- Find the matching room type for this org
    SELECT id INTO rt_id FROM room_types WHERE org_id = p_org_id AND name = gt.room_type_name LIMIT 1;
    IF rt_id IS NOT NULL THEN
      -- Check if a default template already exists for this room type
      SELECT id INTO existing_id FROM checklist_templates
        WHERE org_id = p_org_id AND room_type_id = rt_id AND is_default = true;
      IF existing_id IS NULL THEN
        -- Clone from global template, then mark as default
        existing_id := clone_global_template(gt.id, p_org_id, rt_id);
        UPDATE checklist_templates SET is_default = true WHERE id = existing_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;
