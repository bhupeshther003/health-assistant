-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    marital_status TEXT,
    number_of_children INTEGER DEFAULT 0,
    blood_type TEXT,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    location_city TEXT,
    location_state TEXT,
    location_country TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    avatar_url TEXT,
    health_conditions JSONB DEFAULT '[]'::jsonb,
    physical_problems JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    medications JSONB DEFAULT '[]'::jsonb,
    smoking_status TEXT,
    alcohol_consumption TEXT,
    activity_level TEXT,
    sleep_hours NUMERIC,
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create devices table for smartwatch connections
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL,
    device_name TEXT NOT NULL,
    device_brand TEXT,
    device_type TEXT DEFAULT 'smartwatch',
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'pairing')),
    battery_level INTEGER,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    paired_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, device_id)
);

-- Create health_metrics table for real-time health data
CREATE TABLE public.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    heart_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    blood_sugar NUMERIC,
    steps INTEGER DEFAULT 0,
    calories INTEGER DEFAULT 0,
    oxygen_saturation NUMERIC,
    body_temperature NUMERIC,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create health_alerts table for triggered alerts
CREATE TABLE public.health_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    metric_id UUID REFERENCES public.health_metrics(id) ON DELETE SET NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('bp_high', 'bp_low', 'sugar_high', 'sugar_low', 'heart_rate_high', 'heart_rate_low', 'oxygen_low', 'emergency')),
    severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),
    title TEXT NOT NULL,
    message TEXT,
    suggestion TEXT,
    nearby_locations JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    emergency_shared BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create emergency_shares table for hospital notifications
CREATE TABLE public.emergency_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    alert_id UUID REFERENCES public.health_alerts(id) ON DELETE SET NULL,
    hospital_name TEXT,
    hospital_address TEXT,
    hospital_phone TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    user_location JSONB,
    health_snapshot JSONB,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'responded', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_conversations table for chat history
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_messages table for conversation messages
CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_devices_user_id ON public.devices(user_id);
CREATE INDEX idx_devices_status ON public.devices(status);
CREATE INDEX idx_health_metrics_user_id ON public.health_metrics(user_id);
CREATE INDEX idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX idx_health_alerts_user_id ON public.health_alerts(user_id);
CREATE INDEX idx_health_alerts_is_read ON public.health_alerts(is_read);
CREATE INDEX idx_emergency_shares_user_id ON public.emergency_shares(user_id);
CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for devices
CREATE POLICY "Users can view own devices" ON public.devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON public.devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devices" ON public.devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON public.devices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for health_metrics
CREATE POLICY "Users can view own metrics" ON public.health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own metrics" ON public.health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own metrics" ON public.health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own metrics" ON public.health_metrics FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for health_alerts
CREATE POLICY "Users can view own alerts" ON public.health_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.health_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.health_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.health_alerts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for emergency_shares
CREATE POLICY "Users can view own emergency shares" ON public.emergency_shares FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emergency shares" ON public.emergency_shares FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own emergency shares" ON public.emergency_shares FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own emergency shares" ON public.emergency_shares FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_messages
CREATE POLICY "Users can view own messages" ON public.ai_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.ai_messages FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for health metrics and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.health_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);