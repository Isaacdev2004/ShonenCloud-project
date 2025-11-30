-- Create admin announcements table for global inbox messages
CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view announcements
CREATE POLICY "Anyone can view announcements"
ON public.admin_announcements
FOR SELECT
USING (true);

-- Only admins can create announcements
CREATE POLICY "Admins can create announcements"
ON public.admin_announcements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete announcements
CREATE POLICY "Admins can delete announcements"
ON public.admin_announcements
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));