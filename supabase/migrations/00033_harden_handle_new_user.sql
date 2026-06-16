-- Migration: 00033_harden_handle_new_user.sql
-- Harden the on_auth_user_created safety-net trigger (see 00032) so it can
-- NEVER block authentication.
--
-- The trigger fires AFTER INSERT ON auth.users. The previous version cast
-- raw_app_meta_data ->> 'role' to user_role and relied on the org_id FK with
-- no error handling. A user created with an out-of-enum role (e.g. via the
-- Supabase dashboard or a future auth flow) or an org_id that doesn't exist
-- would raise inside the trigger and roll back the entire auth.users INSERT,
-- breaking signup for that user. A safety net must degrade silently: skip the
-- profile seed and log, but always let the auth row through.
--
-- Still conflict-safe (ON CONFLICT DO NOTHING) so the explicit upserts in
-- registerOrg / createUser remain authoritative for names.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id uuid;
  v_role   text;
BEGIN
  -- Everything is wrapped so NO failure here can roll back the auth.users
  -- INSERT. Even the org_id uuid cast can raise on malformed metadata, so it
  -- lives inside the protected block too.
  BEGIN
    v_org_id := (NEW.raw_app_meta_data ->> 'org_id')::uuid;
    v_role   := NEW.raw_app_meta_data ->> 'role';

    -- Only seed a profile row when org/role are known at creation time.
    -- Flows that set app_metadata later (and insert the row themselves)
    -- are unaffected.
    IF v_org_id IS NULL OR v_role IS NULL THEN
      RETURN NEW;
    END IF;

    -- Skip roles outside the enum instead of letting the cast raise.
    IF v_role NOT IN ('admin', 'supervisor', 'janitor', 'client') THEN
      RAISE WARNING 'handle_new_user: skipping profile seed for % — unknown role %', NEW.id, v_role;
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
  EXCEPTION
    -- Bad org_id FK, malformed uuid, or any other data issue must not block
    -- the auth insert. The app-level upserts (registerOrg/createUser/profile)
    -- will self-heal the row on the next authenticated write.
    WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user: could not seed profile for %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger definition is unchanged from 00032; recreated here for idempotency
-- in case this migration is applied to a database that never received 00032.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
