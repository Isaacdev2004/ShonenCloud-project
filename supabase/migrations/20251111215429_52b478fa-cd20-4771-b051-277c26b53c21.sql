-- Milestone 3: Chat & Private Messaging System

-- Global chat messages table
CREATE TABLE public.global_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view global chat messages
CREATE POLICY "Anyone can view global chat"
  ON public.global_chat_messages
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can send global messages"
  ON public.global_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can delete any message
CREATE POLICY "Admins can delete global messages"
  ON public.global_chat_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Private messages table
CREATE TABLE public.private_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their private messages"
  ON public.private_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send private messages
CREATE POLICY "Users can send private messages"
  ON public.private_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark their received messages as read
CREATE POLICY "Users can update received messages"
  ON public.private_messages
  FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Users can delete messages they sent or received
CREATE POLICY "Users can delete their private messages"
  ON public.private_messages
  FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- User bans table
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  banned_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Anyone can view ban status
CREATE POLICY "Anyone can view bans"
  ON public.user_bans
  FOR SELECT
  USING (true);

-- Admins can manage bans
CREATE POLICY "Admins can manage bans"
  ON public.user_bans
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Milestone 4: BlackYard Store

-- Store items table
CREATE TABLE public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('title', 'profile_picture', 'technique')),
  price integer NOT NULL CHECK (price >= 0),
  image_url text,
  technique_id uuid REFERENCES public.techniques(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view available store items
CREATE POLICY "Anyone can view store items"
  ON public.store_items
  FOR SELECT
  USING (true);

-- Admins can manage store items
CREATE POLICY "Admins can manage store items"
  ON public.store_items
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User purchases table
CREATE TABLE public.user_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_item_id uuid NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  purchased_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON public.user_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can make purchases"
  ON public.user_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchases
CREATE POLICY "Admins can view all purchases"
  ON public.user_purchases
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User active titles table
CREATE TABLE public.user_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

-- Anyone can view active titles
CREATE POLICY "Anyone can view titles"
  ON public.user_titles
  FOR SELECT
  USING (true);

-- Users can manage their own titles
CREATE POLICY "Users can manage own titles"
  ON public.user_titles
  FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;