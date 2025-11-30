-- Create mentor_change_requests table
CREATE TABLE public.mentor_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_mentor_id uuid REFERENCES mentors(id),
  requested_mentor_id uuid NOT NULL REFERENCES mentors(id),
  slot integer NOT NULL CHECK (slot IN (1, 2)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  token_cost integer NOT NULL DEFAULT 100,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mentor_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own requests"
ON public.mentor_change_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own requests"
ON public.mentor_change_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests"
ON public.mentor_change_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update requests"
ON public.mentor_change_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_mentor_change_requests_updated_at
BEFORE UPDATE ON public.mentor_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();