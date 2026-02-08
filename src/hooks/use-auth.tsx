import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  number_of_children: number | null;
  blood_type: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  health_conditions: string[];
  physical_problems: string[];
  allergies: string[];
  medications: string[];
  smoking_status: string | null;
  alcohol_consumption: string | null;
  activity_level: string | null;
  sleep_hours: number | null;
  emergency_contacts: any[];
  onboarding_completed: boolean;
  health_score: number;
  health_risk_level: string;
  food_preference: string | null;
  daily_routine: string | null;
  lifestyle_summary: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  onboardingComplete: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data as Profile;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            const profileData = await fetchProfile(newSession.user.id);
            setProfile(profileData);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).then(setProfile);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    if (!error) {
      await refreshProfile();
    }

    return { error: error as Error | null };
  };

  const deleteAccount = async () => {
    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    try {
      // Delete all user data from related tables
      const deletePromises = [
        supabase.from("medicine_logs").delete().eq("user_id", user.id),
        supabase.from("medicine_reminders").delete().eq("user_id", user.id),
        supabase.from("health_plans").delete().eq("user_id", user.id),
        supabase.from("medical_documents").delete().eq("user_id", user.id),
        supabase.from("mobile_health_data").delete().eq("user_id", user.id),
        supabase.from("digital_wellness").delete().eq("user_id", user.id),
        supabase.from("health_alerts").delete().eq("user_id", user.id),
        supabase.from("health_metrics").delete().eq("user_id", user.id),
        supabase.from("devices").delete().eq("user_id", user.id),
        supabase.from("ai_messages").delete().eq("user_id", user.id),
        supabase.from("ai_conversations").delete().eq("user_id", user.id),
        supabase.from("emergency_shares").delete().eq("user_id", user.id),
        supabase.from("profiles").delete().eq("user_id", user.id),
      ];

      await Promise.all(deletePromises);

      // Sign out the user
      await signOut();

      return { error: null };
    } catch (error) {
      console.error("Error deleting account:", error);
      return { error: error as Error };
    }
  };

  const onboardingComplete = profile?.onboarding_completed ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        onboardingComplete,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
