-- Seed Data for SpaceOps Sprint 1
-- Run with: supabase db reset (applies migrations + seed)

-- ============================================
-- 1. Create organisation
-- ============================================
INSERT INTO organisations (id, name, slug, pass_threshold)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Acme Cleaning Co',
  'acme-cleaning',
  80
);

-- ============================================
-- 2. Create auth users
-- ============================================

-- Admin user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@acme-cleaning.com',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "admin", "org_id": "a0000000-0000-0000-0000-000000000001", "org_slug": "acme-cleaning"}'::jsonb,
  '{"first_name": "Alice", "last_name": "Admin"}'::jsonb,
  'authenticated', 'authenticated',
  now(), now()
);

-- Supervisor user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'supervisor@acme-cleaning.com',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "supervisor", "org_id": "a0000000-0000-0000-0000-000000000001", "org_slug": "acme-cleaning"}'::jsonb,
  '{"first_name": "Sam", "last_name": "Super"}'::jsonb,
  'authenticated', 'authenticated',
  now(), now()
);

-- Janitor user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'janitor@acme-cleaning.com',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "janitor", "org_id": "a0000000-0000-0000-0000-000000000001", "org_slug": "acme-cleaning"}'::jsonb,
  '{"first_name": "Jim", "last_name": "Janitor"}'::jsonb,
  'authenticated', 'authenticated',
  now(), now()
);

-- Client user
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'client@building-owner.com',
  crypt('Password123!', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"], "role": "client", "org_id": "a0000000-0000-0000-0000-000000000001", "org_slug": "acme-cleaning"}'::jsonb,
  '{"first_name": "Charlie", "last_name": "Client"}'::jsonb,
  'authenticated', 'authenticated',
  now(), now()
);

-- ============================================
-- 3. Create public.users records (trigger syncs metadata)
-- ============================================
INSERT INTO users (id, org_id, first_name, last_name, role)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Alice', 'Admin', 'admin'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sam', 'Super', 'supervisor'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Jim', 'Janitor', 'janitor'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Charlie', 'Client', 'client');

-- ============================================
-- 4. Auth identities (required for email/password login)
-- ============================================
INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
VALUES
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000001', 'email', 'admin@acme-cleaning.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
   jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000002', 'email', 'supervisor@acme-cleaning.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003',
   jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000003', 'email', 'janitor@acme-cleaning.com'),
   'email', now(), now(), now()),
  (gen_random_uuid(), 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004',
   jsonb_build_object('sub', 'b0000000-0000-0000-0000-000000000004', 'email', 'client@building-owner.com'),
   'email', now(), now(), now());
