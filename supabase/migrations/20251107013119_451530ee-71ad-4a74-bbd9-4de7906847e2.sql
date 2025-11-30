-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create disciplines enum
CREATE TYPE discipline_type AS ENUM ('Shadow', 'All-Seeing', 'Titan', 'Emperor', 'Finisher', 'Lightbringer');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  discipline discipline_type NOT NULL,
  tokens INTEGER DEFAULT 0 NOT NULL,
  xp_points INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  missions_executed INTEGER DEFAULT 0 NOT NULL,
  profile_picture_url TEXT NOT NULL,
  admin_note TEXT,
  last_check_in TIMESTAMPTZ,
  last_mission_time TIMESTAMPTZ,
  health INTEGER DEFAULT 100 NOT NULL,
  armor INTEGER DEFAULT 0 NOT NULL,
  energy INTEGER DEFAULT 10 NOT NULL,
  current_pack TEXT,
  pack_expires_at TIMESTAMPTZ,
  arena_status TEXT DEFAULT 'Observing zones',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_sign_in TIMESTAMPTZ DEFAULT NOW()
);

-- Create mentors table
CREATE TABLE public.mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_mentors junction table
CREATE TABLE public.user_mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  slot INTEGER CHECK (slot IN (1, 2)) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, slot),
  UNIQUE(user_id, mentor_id)
);

-- Create techniques table
CREATE TABLE public.techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id UUID REFERENCES public.mentors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type_info TEXT NOT NULL,
  cep TEXT NOT NULL,
  price INTEGER NOT NULL,
  level_requirement INTEGER DEFAULT 1 NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_techniques (learned techniques)
CREATE TABLE public.user_techniques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  technique_id UUID REFERENCES public.techniques(id) ON DELETE CASCADE NOT NULL,
  learned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, technique_id)
);

-- Create blog_posts table
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_roles table for admin management
CREATE TYPE app_role AS ENUM ('admin', 'member');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for mentors (public read)
CREATE POLICY "Anyone can view mentors" ON public.mentors FOR SELECT USING (true);
CREATE POLICY "Admins can manage mentors" ON public.mentors FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_mentors
CREATE POLICY "Users can view own mentors" ON public.user_mentors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mentors" ON public.user_mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mentors" ON public.user_mentors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mentors" ON public.user_mentors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for techniques (public read)
CREATE POLICY "Anyone can view techniques" ON public.techniques FOR SELECT USING (true);
CREATE POLICY "Admins can manage techniques" ON public.techniques FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_techniques
CREATE POLICY "Users can view own techniques" ON public.user_techniques FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own techniques" ON public.user_techniques FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view blog posts" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view post likes" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can insert own comments" ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can delete comments" ON public.post_comments FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default mentors (20 mentors with anime-inspired names)
INSERT INTO public.mentors (name, image_url, description) VALUES
('Ryu Hayabusa', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 'Master of Shadow techniques and stealth combat'),
('Sakura Haruno', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2', 'Expert in healing and chakra control'),
('Kakashi Hatake', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d', 'The Copy Ninja with a thousand techniques'),
('Naruto Uzumaki', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d', 'Master of unpredictable fighting style'),
('Sasuke Uchiha', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e', 'Wielder of the legendary Sharingan'),
('Hinata Hyuga', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80', 'Gentle Fist technique specialist'),
('Rock Lee', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e', 'Taijutsu master with unwavering determination'),
('Gaara', 'https://images.unsplash.com/photo-1463453091185-61582044d556', 'Controller of sand and defensive techniques'),
('Jiraiya', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7', 'Legendary Sannin and summoning expert'),
('Tsunade', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330', 'Medical ninjutsu master and super strength'),
('Itachi Uchiha', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6', 'Genjutsu master with unparalleled Sharingan'),
('Minato Namikaze', 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79', 'The Yellow Flash with incredible speed'),
('Orochimaru', 'https://images.unsplash.com/photo-1552058544-f2b08422138a', 'Master of forbidden techniques and transformation'),
('Madara Uchiha', 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f', 'Legendary warrior with immense power'),
('Might Guy', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce', 'Master of the Eight Gates technique'),
('Neji Hyuga', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3', 'Byakugan prodigy and destiny defier'),
('Shikamaru Nara', 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d', 'Brilliant strategist and shadow manipulation expert'),
('Temari', 'https://images.unsplash.com/photo-1517841905240-472988babdf9', 'Wind style master with fan techniques'),
('Killer Bee', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', 'Perfect Jinchuriki with unique fighting style'),
('Yamato', 'https://images.unsplash.com/photo-1502378735452-bc7d86632805', 'Wood style technique specialist');

-- Insert some sample techniques for a few mentors
INSERT INTO public.techniques (mentor_id, name, description, type_info, cep, price, level_requirement, image_url)
SELECT id, 'Shadow Clone', 'Creates multiple copies of the user to confuse and overwhelm opponents.', 'Clone, Tactical', '3.2.5', 10, 1, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853'
FROM public.mentors WHERE name = 'Naruto Uzumaki'
UNION ALL
SELECT id, 'Chidori', 'A lightning-based piercing attack concentrated in the hand.', 'Lightning, Melee', '5.3.8', 15, 5, 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f'
FROM public.mentors WHERE name = 'Sasuke Uchiha'
UNION ALL
SELECT id, 'Rasengan', 'A spinning sphere of chakra that delivers devastating impact.', 'Energy, Melee', '4.4.7', 12, 3, 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f'
FROM public.mentors WHERE name = 'Naruto Uzumaki';

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();