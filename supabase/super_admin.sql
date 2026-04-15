-- Run this in the Supabase SQL Editor (SQL Editor → New query → paste → Run).

-- Allows a super admin to grant themselves (or keep) admin access to any turf.
-- Called automatically when a super admin opens /admin/[turfId].
CREATE OR REPLACE FUNCTION super_admin_grant_access(
  p_super_admin_user_id UUID,
  p_astroturf_id        UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_super_admin_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO astroturf_admins (user_id, astroturf_id)
  VALUES (p_super_admin_user_id, p_astroturf_id)
  ON CONFLICT DO NOTHING;
END;
$$;


-- Allows a super admin to create a turf directly (no application process).
CREATE OR REPLACE FUNCTION super_admin_create_turf(
  p_super_admin_user_id UUID,
  p_name                TEXT,
  p_address             TEXT,
  p_price_per_hour      NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_turf_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM super_admins WHERE user_id = p_super_admin_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO astroturfs (name, address, price_per_hour, is_active)
  VALUES (p_name, p_address, p_price_per_hour, true)
  RETURNING id INTO v_turf_id;

  -- Grant the super admin full admin access to the new turf
  INSERT INTO astroturf_admins (user_id, astroturf_id)
  VALUES (p_super_admin_user_id, v_turf_id);

  RETURN v_turf_id;
END;
$$;
