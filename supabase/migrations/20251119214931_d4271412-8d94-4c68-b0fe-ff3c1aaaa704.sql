-- Create global settings table to track dynamic prices
CREATE TABLE IF NOT EXISTS public.global_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert initial mentor change price (45 tokens)
INSERT INTO public.global_settings (key, value)
VALUES ('mentor_change_price', 45)
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can view settings"
  ON public.global_settings
  FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
  ON public.global_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to handle mentor change request with dynamic pricing
CREATE OR REPLACE FUNCTION public.request_mentor_change(
  p_user_id uuid,
  p_current_mentor_id uuid,
  p_requested_mentor_id uuid,
  p_slot integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_price integer;
  v_user_tokens integer;
  v_request_id uuid;
BEGIN
  -- Get current price
  SELECT value INTO v_current_price
  FROM global_settings
  WHERE key = 'mentor_change_price';

  -- Get user's current tokens
  SELECT tokens INTO v_user_tokens
  FROM profiles
  WHERE id = p_user_id;

  -- Check if user has enough tokens
  IF v_user_tokens < v_current_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient tokens',
      'required', v_current_price,
      'available', v_user_tokens
    );
  END IF;

  -- Deduct tokens from user
  UPDATE profiles
  SET tokens = tokens - v_current_price
  WHERE id = p_user_id;

  -- Create mentor change request
  INSERT INTO mentor_change_requests (
    user_id,
    current_mentor_id,
    requested_mentor_id,
    slot,
    token_cost,
    status
  )
  VALUES (
    p_user_id,
    p_current_mentor_id,
    p_requested_mentor_id,
    p_slot,
    v_current_price,
    'pending'
  )
  RETURNING id INTO v_request_id;

  -- Increment price for next request (add 5 tokens)
  UPDATE global_settings
  SET value = value + 5,
      updated_at = now()
  WHERE key = 'mentor_change_price';

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'tokens_spent', v_current_price
  );
END;
$$;