-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-documents', 
  'medical-documents', 
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- Create medical_documents table
CREATE TABLE public.medical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  document_type TEXT, -- 'prescription', 'lab_report', 'discharge_summary', 'imaging', 'other'
  ai_summary TEXT,
  ai_extracted_data JSONB, -- Extracted medicines, diagnoses, values
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health_plans table
CREATE TABLE public.health_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  plan_type TEXT NOT NULL, -- '7-day', '30-day', 'custom'
  duration_days INTEGER NOT NULL DEFAULT 7,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused'
  diet_plan JSONB, -- Daily diet recommendations
  activity_plan JSONB, -- Exercise and activity schedule
  sleep_plan JSONB, -- Sleep schedule and tips
  medicine_schedule JSONB, -- Medicine timing
  ai_recommendations TEXT,
  based_on_documents UUID[], -- References to medical_documents
  progress_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine_reminders table
CREATE TABLE public.medicine_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT NOT NULL, -- 'daily', 'twice_daily', 'thrice_daily', 'weekly', 'as_needed'
  times_of_day TEXT[], -- ['08:00', '20:00']
  days_of_week INTEGER[], -- [1,2,3,4,5,6,7] for daily, specific days otherwise
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  instructions TEXT,
  source_document_id UUID REFERENCES public.medical_documents(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_taken_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine_logs table to track taken medicines
CREATE TABLE public.medicine_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reminder_id UUID REFERENCES public.medicine_reminders(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'taken', 'missed', 'skipped'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mobile_health_data table for device-collected metrics
CREATE TABLE public.mobile_health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  steps INTEGER DEFAULT 0,
  distance_meters INTEGER DEFAULT 0,
  calories_burned INTEGER DEFAULT 0,
  active_minutes INTEGER DEFAULT 0,
  floors_climbed INTEGER DEFAULT 0,
  standing_hours INTEGER DEFAULT 0,
  movement_score INTEGER, -- 0-100 derived score
  data_source TEXT DEFAULT 'web', -- 'web', 'android', 'ios', 'wearable'
  raw_sensor_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, recorded_date)
);

-- Enable RLS on all tables
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_health_data ENABLE ROW LEVEL SECURITY;

-- RLS policies for medical_documents
CREATE POLICY "Users can view their own documents" ON public.medical_documents
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload their own documents" ON public.medical_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.medical_documents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.medical_documents
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for health_plans
CREATE POLICY "Users can view their own plans" ON public.health_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plans" ON public.health_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.health_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON public.health_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for medicine_reminders
CREATE POLICY "Users can view their own reminders" ON public.medicine_reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.medicine_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.medicine_reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.medicine_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for medicine_logs
CREATE POLICY "Users can view their own logs" ON public.medicine_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own logs" ON public.medicine_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own logs" ON public.medicine_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for mobile_health_data
CREATE POLICY "Users can view their own mobile data" ON public.mobile_health_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mobile data" ON public.mobile_health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mobile data" ON public.mobile_health_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies for medical-documents bucket
CREATE POLICY "Users can view their own medical files" ON storage.objects
  FOR SELECT USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own medical files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own medical files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own medical files" ON storage.objects
  FOR DELETE USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicine_reminders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_health_data;

-- Create trigger for updated_at columns
CREATE TRIGGER update_health_plans_updated_at
  BEFORE UPDATE ON public.health_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicine_reminders_updated_at
  BEFORE UPDATE ON public.medicine_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobile_health_data_updated_at
  BEFORE UPDATE ON public.mobile_health_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();