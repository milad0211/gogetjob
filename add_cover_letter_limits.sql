-- ============================================================
-- Migration: Env-driven limits + Cover Letter quota reservation
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1) Track cover-letter usage in active Pro cycle
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pro_cover_letters_used_cycle int NOT NULL DEFAULT 0;

-- ============================================================
-- 2) Env-driven resume reservation RPC (new overload)
--    reserve_generation(
--      p_user_id uuid,
--      p_pro_monthly_limit int,
--      p_pro_yearly_limit int,
--      p_free_limit int
--    )
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_generation(
  p_user_id uuid,
  p_pro_monthly_limit int DEFAULT 30,
  p_pro_yearly_limit int DEFAULT 360,
  p_free_limit int DEFAULT 3
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_billing_cycle text;
  v_free_used int;
  v_pro_used int;
  v_pro_access_until timestamptz;
  v_pro_cycle_ends_at timestamptz;
  v_pro_active boolean;
  v_limit int;
  v_remaining int;
BEGIN
  SELECT plan, billing_cycle, free_generations_used_total,
         pro_generations_used_cycle, pro_access_until, pro_cycle_ends_at
  INTO v_plan, v_billing_cycle, v_free_used,
       v_pro_used, v_pro_access_until, v_pro_cycle_ends_at
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'user_not_found', 'remaining', 0);
  END IF;

  v_pro_active := (v_plan = 'pro'
                   AND v_pro_access_until IS NOT NULL
                   AND now() < v_pro_access_until);

  IF v_pro_active THEN
    IF v_pro_cycle_ends_at IS NOT NULL AND now() >= v_pro_cycle_ends_at THEN
      v_pro_used := 0;
      UPDATE profiles SET pro_generations_used_cycle = 0 WHERE id = p_user_id;
    END IF;

    IF v_billing_cycle = 'year' THEN
      v_limit := GREATEST(0, p_pro_yearly_limit);
    ELSE
      v_limit := GREATEST(0, p_pro_monthly_limit);
    END IF;

    IF v_pro_used >= v_limit THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'pro_limit_reached',
        'remaining', 0,
        'limit', v_limit,
        'resets_at', v_pro_cycle_ends_at
      );
    END IF;

    UPDATE profiles
    SET pro_generations_used_cycle = pro_generations_used_cycle + 1
    WHERE id = p_user_id;

    v_remaining := v_limit - v_pro_used - 1;
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'pro',
      'remaining', v_remaining,
      'limit', v_limit,
      'resets_at', v_pro_cycle_ends_at
    );
  ELSE
    IF v_free_used >= GREATEST(0, p_free_limit) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'free_limit_reached',
        'remaining', 0,
        'limit', GREATEST(0, p_free_limit)
      );
    END IF;

    UPDATE profiles
    SET free_generations_used_total = free_generations_used_total + 1
    WHERE id = p_user_id;

    v_remaining := GREATEST(0, p_free_limit) - v_free_used - 1;
    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'free',
      'remaining', v_remaining,
      'limit', GREATEST(0, p_free_limit)
    );
  END IF;
END;
$$;

-- ============================================================
-- 3) Cover-letter reservation RPC (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_cover_letter(
  p_user_id uuid,
  p_pro_monthly_limit int DEFAULT 20,
  p_pro_yearly_limit int DEFAULT 250
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_billing_cycle text;
  v_used int;
  v_pro_access_until timestamptz;
  v_pro_cycle_ends_at timestamptz;
  v_pro_active boolean;
  v_limit int;
  v_remaining int;
BEGIN
  SELECT plan, billing_cycle, pro_cover_letters_used_cycle,
         pro_access_until, pro_cycle_ends_at
  INTO v_plan, v_billing_cycle, v_used,
       v_pro_access_until, v_pro_cycle_ends_at
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'user_not_found', 'remaining', 0);
  END IF;

  v_pro_active := (v_plan = 'pro'
                   AND v_pro_access_until IS NOT NULL
                   AND now() < v_pro_access_until);

  IF NOT v_pro_active THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'not_pro',
      'remaining', 0,
      'limit', 0
    );
  END IF;

  IF v_pro_cycle_ends_at IS NOT NULL AND now() >= v_pro_cycle_ends_at THEN
    v_used := 0;
    UPDATE profiles SET pro_cover_letters_used_cycle = 0 WHERE id = p_user_id;
  END IF;

  IF v_billing_cycle = 'year' THEN
    v_limit := GREATEST(0, p_pro_yearly_limit);
  ELSE
    v_limit := GREATEST(0, p_pro_monthly_limit);
  END IF;

  IF v_used >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'cover_letter_limit_reached',
      'remaining', 0,
      'limit', v_limit,
      'resets_at', v_pro_cycle_ends_at
    );
  END IF;

  UPDATE profiles
  SET pro_cover_letters_used_cycle = pro_cover_letters_used_cycle + 1
  WHERE id = p_user_id;

  v_remaining := v_limit - v_used - 1;
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'pro',
    'remaining', v_remaining,
    'limit', v_limit,
    'resets_at', v_pro_cycle_ends_at
  );
END;
$$;

-- ============================================================
-- 4) Release cover-letter reservation
-- ============================================================
CREATE OR REPLACE FUNCTION public.release_cover_letter(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET pro_cover_letters_used_cycle = GREATEST(0, pro_cover_letters_used_cycle - 1)
  WHERE id = p_user_id;
END;
$$;
