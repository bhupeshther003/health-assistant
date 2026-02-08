-- Add onboarding and digital wellness fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_risk_level text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS food_preference text,
ADD COLUMN IF NOT EXISTS daily_routine text,
ADD COLUMN IF NOT EXISTS lifestyle_summary text;

-- Create digital_wellness table for behavioral metrics
CREATE TABLE IF NOT EXISTS public.digital_wellness (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    recorded_date date NOT NULL DEFAULT CURRENT_DATE,
    screen_time_minutes integer DEFAULT 0,
    unlock_count integer DEFAULT 0,
    app_switch_count integer DEFAULT 0,
    late_night_minutes integer DEFAULT 0,
    focus_stability text DEFAULT 'moderate',
    sleep_consistency text DEFAULT 'consistent',
    stress_level text DEFAULT 'low',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, recorded_date)
);

-- Enable RLS on digital_wellness
ALTER TABLE public.digital_wellness ENABLE ROW LEVEL SECURITY;

-- RLS policies for digital_wellness
CREATE POLICY "Users can view own wellness data"
ON public.digital_wellness FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness data"
ON public.digital_wellness FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness data"
ON public.digital_wellness FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness data"
ON public.digital_wellness FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for digital_wellness
ALTER PUBLICATION supabase_realtime ADD TABLE public.digital_wellness;

-- Update trigger for digital_wellness
CREATE TRIGGER update_digital_wellness_updated_at
BEFORE UPDATE ON public.digital_wellness
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();