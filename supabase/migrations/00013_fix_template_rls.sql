-- Fix: org_isolation must be SELECT-only to avoid bypassing role-based INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "org_isolation" ON activity_templates;
DROP POLICY IF EXISTS "supervisor_insert" ON activity_templates;
DROP POLICY IF EXISTS "supervisor_update" ON activity_templates;
DROP POLICY IF EXISTS "supervisor_delete" ON activity_templates;

-- Read: any org member can see templates
CREATE POLICY "org_read" ON activity_templates
  FOR SELECT USING (org_id = auth_org_id());

-- Write: only admins/supervisors
CREATE POLICY "supervisor_insert" ON activity_templates
  FOR INSERT WITH CHECK (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "supervisor_update" ON activity_templates
  FOR UPDATE USING (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );

CREATE POLICY "supervisor_delete" ON activity_templates
  FOR DELETE USING (
    org_id = auth_org_id()
    AND auth_role() IN ('admin', 'supervisor')
  );
