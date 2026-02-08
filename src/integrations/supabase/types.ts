export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          battery_level: number | null
          created_at: string
          device_brand: string | null
          device_id: string
          device_name: string
          device_type: string | null
          id: string
          last_sync_at: string | null
          paired_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          device_brand?: string | null
          device_id: string
          device_name: string
          device_type?: string | null
          id?: string
          last_sync_at?: string | null
          paired_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          device_brand?: string | null
          device_id?: string
          device_name?: string
          device_type?: string | null
          id?: string
          last_sync_at?: string | null
          paired_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      digital_wellness: {
        Row: {
          app_switch_count: number | null
          created_at: string | null
          focus_stability: string | null
          id: string
          late_night_minutes: number | null
          recorded_date: string
          screen_time_minutes: number | null
          sleep_consistency: string | null
          stress_level: string | null
          unlock_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_switch_count?: number | null
          created_at?: string | null
          focus_stability?: string | null
          id?: string
          late_night_minutes?: number | null
          recorded_date?: string
          screen_time_minutes?: number | null
          sleep_consistency?: string | null
          stress_level?: string | null
          unlock_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_switch_count?: number | null
          created_at?: string | null
          focus_stability?: string | null
          id?: string
          late_night_minutes?: number | null
          recorded_date?: string
          screen_time_minutes?: number | null
          sleep_consistency?: string | null
          stress_level?: string | null
          unlock_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      emergency_shares: {
        Row: {
          alert_id: string | null
          created_at: string
          expires_at: string | null
          health_snapshot: Json | null
          hospital_address: string | null
          hospital_name: string | null
          hospital_phone: string | null
          id: string
          latitude: number | null
          longitude: number | null
          shared_at: string
          status: string | null
          user_id: string
          user_location: Json | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string
          expires_at?: string | null
          health_snapshot?: Json | null
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_phone?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          shared_at?: string
          status?: string | null
          user_id: string
          user_location?: Json | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string
          expires_at?: string | null
          health_snapshot?: Json | null
          hospital_address?: string | null
          hospital_name?: string | null
          hospital_phone?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          shared_at?: string
          status?: string | null
          user_id?: string
          user_location?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_shares_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "health_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      health_alerts: {
        Row: {
          alert_type: string
          created_at: string
          emergency_shared: boolean | null
          id: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string | null
          metric_id: string | null
          nearby_locations: Json | null
          resolved_at: string | null
          severity: string | null
          suggestion: string | null
          title: string
          triggered_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          emergency_shared?: boolean | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string | null
          metric_id?: string | null
          nearby_locations?: Json | null
          resolved_at?: string | null
          severity?: string | null
          suggestion?: string | null
          title: string
          triggered_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          emergency_shared?: boolean | null
          id?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string | null
          metric_id?: string | null
          nearby_locations?: Json | null
          resolved_at?: string | null
          severity?: string | null
          suggestion?: string | null
          title?: string
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_alerts_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "health_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      health_metrics: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          blood_sugar: number | null
          body_temperature: number | null
          calories: number | null
          created_at: string
          device_id: string | null
          heart_rate: number | null
          id: string
          oxygen_saturation: number | null
          recorded_at: string
          steps: number | null
          user_id: string
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          body_temperature?: number | null
          calories?: number | null
          created_at?: string
          device_id?: string | null
          heart_rate?: number | null
          id?: string
          oxygen_saturation?: number | null
          recorded_at?: string
          steps?: number | null
          user_id: string
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          blood_sugar?: number | null
          body_temperature?: number | null
          calories?: number | null
          created_at?: string
          device_id?: string | null
          heart_rate?: number | null
          id?: string
          oxygen_saturation?: number | null
          recorded_at?: string
          steps?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_metrics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      health_plans: {
        Row: {
          activity_plan: Json | null
          ai_recommendations: string | null
          based_on_documents: string[] | null
          created_at: string
          diet_plan: Json | null
          duration_days: number
          end_date: string
          id: string
          medicine_schedule: Json | null
          plan_name: string
          plan_type: string
          progress_data: Json | null
          sleep_plan: Json | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_plan?: Json | null
          ai_recommendations?: string | null
          based_on_documents?: string[] | null
          created_at?: string
          diet_plan?: Json | null
          duration_days?: number
          end_date: string
          id?: string
          medicine_schedule?: Json | null
          plan_name: string
          plan_type: string
          progress_data?: Json | null
          sleep_plan?: Json | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_plan?: Json | null
          ai_recommendations?: string | null
          based_on_documents?: string[] | null
          created_at?: string
          diet_plan?: Json | null
          duration_days?: number
          end_date?: string
          id?: string
          medicine_schedule?: Json | null
          plan_name?: string
          plan_type?: string
          progress_data?: Json | null
          sleep_plan?: Json | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          ai_extracted_data: Json | null
          ai_summary: string | null
          created_at: string
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          processed_at: string | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          created_at?: string
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          processed_at?: string | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ai_extracted_data?: Json | null
          ai_summary?: string | null
          created_at?: string
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          processed_at?: string | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_logs: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reminder_id: string | null
          scheduled_time: string
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id?: string | null
          scheduled_time: string
          status?: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reminder_id?: string | null
          scheduled_time?: string
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "medicine_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      medicine_reminders: {
        Row: {
          alarm_sound: string | null
          alarm_vibrate: boolean | null
          created_at: string
          days_of_week: number[] | null
          dosage: string | null
          end_date: string | null
          frequency: string
          id: string
          instructions: string | null
          is_active: boolean
          last_taken_at: string | null
          medicine_name: string
          repeat_until_acknowledged: boolean | null
          snooze_minutes: number | null
          source_document_id: string | null
          start_date: string
          times_of_day: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alarm_sound?: string | null
          alarm_vibrate?: boolean | null
          created_at?: string
          days_of_week?: number[] | null
          dosage?: string | null
          end_date?: string | null
          frequency: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          last_taken_at?: string | null
          medicine_name: string
          repeat_until_acknowledged?: boolean | null
          snooze_minutes?: number | null
          source_document_id?: string | null
          start_date?: string
          times_of_day?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alarm_sound?: string | null
          alarm_vibrate?: boolean | null
          created_at?: string
          days_of_week?: number[] | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          last_taken_at?: string | null
          medicine_name?: string
          repeat_until_acknowledged?: boolean | null
          snooze_minutes?: number | null
          source_document_id?: string | null
          start_date?: string
          times_of_day?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_reminders_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_health_data: {
        Row: {
          active_minutes: number | null
          calories_burned: number | null
          created_at: string
          data_source: string | null
          distance_meters: number | null
          floors_climbed: number | null
          id: string
          movement_score: number | null
          raw_sensor_data: Json | null
          recorded_date: string
          standing_hours: number | null
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          data_source?: string | null
          distance_meters?: number | null
          floors_climbed?: number | null
          id?: string
          movement_score?: number | null
          raw_sensor_data?: Json | null
          recorded_date?: string
          standing_hours?: number | null
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_minutes?: number | null
          calories_burned?: number | null
          created_at?: string
          data_source?: string | null
          distance_meters?: number | null
          floors_climbed?: number | null
          id?: string
          movement_score?: number | null
          raw_sensor_data?: Json | null
          recorded_date?: string
          standing_hours?: number | null
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          alcohol_consumption: string | null
          allergies: Json | null
          avatar_url: string | null
          blood_type: string | null
          created_at: string
          daily_routine: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contacts: Json | null
          first_name: string | null
          food_preference: string | null
          gender: string | null
          health_conditions: Json | null
          health_memory: Json | null
          health_memory_updated_at: string | null
          health_risk_level: string | null
          health_score: number | null
          height_cm: number | null
          id: string
          last_name: string | null
          latitude: number | null
          lifestyle_summary: string | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          longitude: number | null
          marital_status: string | null
          medications: Json | null
          number_of_children: number | null
          onboarding_completed: boolean | null
          phone: string | null
          physical_problems: Json | null
          sleep_hours: number | null
          smoking_status: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          alcohol_consumption?: string | null
          allergies?: Json | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          daily_routine?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contacts?: Json | null
          first_name?: string | null
          food_preference?: string | null
          gender?: string | null
          health_conditions?: Json | null
          health_memory?: Json | null
          health_memory_updated_at?: string | null
          health_risk_level?: string | null
          health_score?: number | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          lifestyle_summary?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          marital_status?: string | null
          medications?: Json | null
          number_of_children?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          physical_problems?: Json | null
          sleep_hours?: number | null
          smoking_status?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          alcohol_consumption?: string | null
          allergies?: Json | null
          avatar_url?: string | null
          blood_type?: string | null
          created_at?: string
          daily_routine?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contacts?: Json | null
          first_name?: string | null
          food_preference?: string | null
          gender?: string | null
          health_conditions?: Json | null
          health_memory?: Json | null
          health_memory_updated_at?: string | null
          health_risk_level?: string | null
          health_score?: number | null
          height_cm?: number | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          lifestyle_summary?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          longitude?: number | null
          marital_status?: string | null
          medications?: Json | null
          number_of_children?: number | null
          onboarding_completed?: boolean | null
          phone?: string | null
          physical_problems?: Json | null
          sleep_hours?: number | null
          smoking_status?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
