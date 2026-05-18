-- Migration: 00032_handle_new_user.sql
-- Safety-net: guarantee every auth.users row has a matching public.users
-- profile row. Previously, users created outside the explicit insert path
-- (Supabase dashboard, manual API calls, future auth flows) had no
-- public.users row, which 404'd the profile page and silently no-op-ed
-- profile/avatar writes (UPDATE ... WHERE id matched 0 rows).
--
-- The trigger is conflict-safe (ON CONFLICT DO NOTHING) so the explicit
-- upserts in registerOrg / createUser remain authoritative for names.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_role   text;
BEGIN
  v_org_id := (NEW.raw_app_meta_data ->> 'org_id')::uuid;
  v_role   := NEW.raw_app_meta_data ->> 'role';

  -- Only seed a profile row when org/role are known at creation time.
  -- Flows that set app_metadata later (and insert the row themselves)
  -- are unaffected.
  IF v_org_id IS NULL OR v_role IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, org_id, role, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    v_org_id,
    v_role::user_role,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'first_name', ''),
      initcap(split_part(NEW.email, '@', 1))
    ),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'last_name', ''), 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
