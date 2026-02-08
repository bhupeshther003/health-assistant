-- Enable global health memory storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS health_memory JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_memory_updated_at TIMESTAMPTZ DEFAULT now();

-- Enable realtime for ai_conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_conversations;

-- Enable realtime for ai_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

-- Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_updated 
ON public.ai_conversations(user_id, updated_at DESC);

-- Create index for faster message lookups
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created 
ON public.ai_messages(conversation_id, created_at ASC);

-- Add alarm-related columns to medicine_reminders
ALTER TABLE public.medicine_reminders
ADD COLUMN IF NOT EXISTS alarm_sound VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS alarm_vibrate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS repeat_until_acknowledged BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS snooze_minutes INTEGER DEFAULT 5;