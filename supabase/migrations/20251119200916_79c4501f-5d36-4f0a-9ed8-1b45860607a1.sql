-- Create missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('data', 'world')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create world mission questions table (for the 3-question sequence)
CREATE TABLE public.world_mission_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL CHECK (question_order BETWEEN 1 AND 3),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mission_id, question_order)
);

-- Enable Row Level Security
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_mission_questions ENABLE ROW LEVEL SECURITY;

-- Policies for missions
CREATE POLICY "Admins can manage missions"
ON public.missions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active missions"
ON public.missions
FOR SELECT
USING (is_active = true);

-- Policies for world mission questions
CREATE POLICY "Admins can manage world questions"
ON public.world_mission_questions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view world questions"
ON public.world_mission_questions
FOR SELECT
USING (true);