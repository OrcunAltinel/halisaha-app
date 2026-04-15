-- Run this in the Supabase SQL Editor (SQL Editor → New query → paste → Run).
-- Allows a turf admin to instantly confirm a reservation on behalf of a walk-in customer.

CREATE OR REPLACE FUNCTION admin_reserve_slot(
  p_time_slot_id    UUID,
  p_astroturf_id    UUID,
  p_admin_user_id   UUID,
  p_customer_name   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reservation_id UUID;
  v_is_available   BOOLEAN;
BEGIN
  -- Verify the caller is an admin of this turf
  IF NOT EXISTS (
    SELECT 1 FROM astroturf_admins
    WHERE user_id = p_admin_user_id
      AND astroturf_id = p_astroturf_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Check slot belongs to turf and is still available
  SELECT is_available INTO v_is_available
  FROM time_slots
  WHERE id = p_time_slot_id
    AND astroturf_id = p_astroturf_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Slot is already booked';
  END IF;

  -- Create a confirmed reservation; store the customer name in cancellation_reason
  INSERT INTO reservations (
    astroturf_id, time_slot_id, user_id,
    status, payment_status, total_price, cancellation_reason
  )
  VALUES (
    p_astroturf_id, p_time_slot_id, p_admin_user_id,
    'confirmed', 'paid', 0, p_customer_name
  )
  RETURNING id INTO v_reservation_id;

  -- Lock the slot
  UPDATE time_slots SET is_available = false WHERE id = p_time_slot_id;

  RETURN v_reservation_id;
END;
$$;
