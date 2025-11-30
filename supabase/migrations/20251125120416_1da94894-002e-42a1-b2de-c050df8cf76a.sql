-- Create arena admin messages table
CREATE TABLE public.arena_admin_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  admin_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arena_admin_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active arena messages" 
ON public.arena_admin_messages 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can create arena messages" 
ON public.arena_admin_messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update arena messages" 
ON public.arena_admin_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete arena messages" 
ON public.arena_admin_messages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_arena_admin_messages_updated_at
BEFORE UPDATE ON public.arena_admin_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();