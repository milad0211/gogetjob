-- ============================================================
-- Migration: Pro Plans (Monthly / Yearly) + Reserve/Release Usage
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Rename free_generations_used → free_generations_used_total (Lifetime counter)
ALTER TABLE public.profiles RENAME COLUMN free_generations_used TO free_generations_used_total;

-- 2. Add billing_cycle column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_cycle text NULL
  CHECK (billing_cycle IN ('month', 'year'));

-- 3. Rename pro_generations_used_month → pro_generations_used_cycle
ALTER TABLE public.profiles RENAME COLUMN pro_generations_used_month TO pro_generations_used_cycle;

-- 4. Rename pro_generation_reset_at → pro_cycle_started_at (repurpose)
ALTER TABLE public.profiles RENAME COLUMN pro_generation_reset_at TO pro_cycle_started_at;

-- 5. Add new period columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_cycle_ends_at timestamptz NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pro_access_until timestamptz NULL;

-- 6. Add Polar ID columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS polar_customer_id text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS polar_subscription_id text NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS polar_product_id text NULL;

-- 7. Webhook idempotency table
CREATE TABLE IF NOT EXISTS polar_webhook_events (
  id text PRIMARY KEY,
  received_at timestamptz DEFAULT now(),
  type text,
  subscription_id text
);

-- ============================================================
-- 8. Reserve RPC: reserve_generation(p_user_id uuid)
--    Atomically checks limits and increments the counter.
--    Returns JSON: { "allowed", "reason" (free|pro), "remaining", "limit", "resets_at" }
--    The "reason" field tells caller which counter was reserved (free or pro).
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_generation(p_user_id uuid)
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
  -- Lock the row for atomic read-modify-write
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

  -- Determine if Pro is currently active
  v_pro_active := (v_plan = 'pro'
                   AND v_pro_access_until IS NOT NULL
                   AND now() < v_pro_access_until);

  IF v_pro_active THEN
    -- Check if current cycle has expired (webhook should have renewed, but be safe)
    IF v_pro_cycle_ends_at IS NOT NULL AND now() >= v_pro_cycle_ends_at THEN
      v_pro_used := 0;
      UPDATE profiles SET pro_generations_used_cycle = 0 WHERE id = p_user_id;
    END IF;

    -- Determine limit based on billing_cycle
    IF v_billing_cycle = 'year' THEN
      v_limit := 360;
    ELSE
      v_limit := 30;
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

    -- Reserve one pro credit
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
    -- Free tier
    IF v_free_used >= 3 THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'free_limit_reached',
        'remaining', 0,
        'limit', 3
      );
    END IF;

    -- Reserve one free credit
    UPDATE profiles
    SET free_generations_used_total = free_generations_used_total + 1
    WHERE id = p_user_id;

    v_remaining := 3 - v_free_used - 1;

    RETURN jsonb_build_object(
      'allowed', true,
      'reason', 'free',
      'remaining', v_remaining,
      'limit', 3
    );
  END IF;
END;
$$;

-- ============================================================
-- 9. Release RPC: release_generation(p_user_id uuid, p_type text)
--    Called when generation FAILS after reservation.
--    Decrements the correct counter so the user doesn't lose a credit.
--    p_type must be 'free' or 'pro' (returned by reserve_generation.reason).
-- ============================================================
CREATE OR REPLACE FUNCTION public.release_generation(p_user_id uuid, p_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_type = 'free' THEN
    UPDATE profiles
    SET free_generations_used_total = GREATEST(0, free_generations_used_total - 1)
    WHERE id = p_user_id;
  ELSIF p_type = 'pro' THEN
    UPDATE profiles
    SET pro_generations_used_cycle = GREATEST(0, pro_generations_used_cycle - 1)
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ============================================================
-- 10. Drop old function if exists (cleanup)
-- ============================================================
DROP FUNCTION IF EXISTS public.consume_generation(uuid);
