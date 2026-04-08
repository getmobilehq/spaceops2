-- Migration: 00027_adhoc_task_images_bucket.sql
-- Storage bucket for ad-hoc task reference images

INSERT INTO storage.buckets (id, name, public)
VALUES ('adhoc-task-images', 'adhoc-task-images', true)
ON CONFLICT (id) DO NOTHING;

-- Supervisors/admins can upload images (scoped to their org folder)
CREATE POLICY "Supervisors can upload adhoc task images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'adhoc-task-images'
    AND auth_role() IN ('admin', 'supervisor')
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Org members can view images (janitors need to see the reference photo)
CREATE POLICY "Org members can view adhoc task images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'adhoc-task-images'
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Supervisors can update/replace images
CREATE POLICY "Supervisors can update adhoc task images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'adhoc-task-images'
    AND auth_role() IN ('admin', 'supervisor')
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );

-- Supervisors can delete images
CREATE POLICY "Supervisors can delete adhoc task images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'adhoc-task-images'
    AND auth_role() IN ('admin', 'supervisor')
    AND (storage.foldername(name))[1] = auth_org_id()::text
  );
