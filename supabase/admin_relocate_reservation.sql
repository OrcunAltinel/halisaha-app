-- Run this in the Supabase SQL Editor (SQL Editor → New query → paste → Run).

-- Allows a turf admin to relocate (move) a reservation to a different time slot.
CREATE OR REPLACE FUNCTION admin_relocate_reservation(
  p_reservation_id   UUID,
  p_new_time_slot_id UUID,
  p_admin_user_id    UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_old_slot_id    UUID;
  v_astroturf_id   UUID;
  v_res_status     TEXT;
  v_new_slot_avail BOOLEAN;
  v_new_slot_turf  UUID;
  v_new_slot_price NUMERIC;
BEGIN
  SELECT time_slot_id, astroturf_id, status
    INTO v_old_slot_id, v_astroturf_id, v_res_status
    FROM reservations WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found';
  END IF;

  IF v_res_status <> 'confirmed' THEN
    RAISE EXCEPTION 'Only confirmed reservations can be relocated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM astroturf_admins
     WHERE user_id = p_admin_user_id AND astroturf_id = v_astroturf_id
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT ts.is_available, ts.astroturf_id, COALESCE(ts.price, a.price_per_hour)
    INTO v_new_slot_avail, v_new_slot_turf, v_new_slot_price
    FROM time_slots ts
    JOIN astroturfs a ON a.id = ts.astroturf_id
   WHERE ts.id = p_new_time_slot_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target time slot not found';
  END IF;

  IF v_new_slot_turf <> v_astroturf_id THEN
    RAISE EXCEPTION 'Target slot does not belong to this turf';
  END IF;

  IF NOT v_new_slot_avail THEN
    RAISE EXCEPTION 'Target time slot is not available';
  END IF;

  UPDATE time_slots SET is_available = true WHERE id = v_old_slot_id;

  UPDATE time_slots SET is_available = false WHERE id = p_new_time_slot_id;

  UPDATE reservations
     SET time_slot_id = p_new_time_slot_id,
         total_price  = v_new_slot_price,
         updated_at   = now()
   WHERE id = p_reservation_id;
END;
$func$;
