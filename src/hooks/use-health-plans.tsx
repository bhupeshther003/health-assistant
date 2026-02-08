import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

interface HealthPlan {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  status: string;
  diet_plan: any;
  activity_plan: any;
  sleep_plan: any;
  medicine_schedule: any;
  ai_recommendations: string | null;
  based_on_documents: string[];
  progress_data: any;
  created_at: string;
  updated_at: string;
}

interface GeneratePlanOptions {
  planType: "wellness" | "weight_loss" | "fitness" | "recovery" | "custom";
  duration: 7 | 14 | 30;
  focusAreas: string[];
  dietPreferences?: string[];
  customInstructions?: string;
}

export function useHealthPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<HealthPlan[]>([]);
  const [activePlan, setActivePlan] = useState<HealthPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("health_plans")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPlans(data || []);
      
      // Find active plan
      const active = (data || []).find((p) => p.status === "active");
      setActivePlan(active || null);
    } catch (error) {
      console.error("Error fetching health plans:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const generatePlan = async (options: GeneratePlanOptions): Promise<HealthPlan | null> => {
    if (!user) {
      toast.error("Please login to generate a plan");
      return null;
    }

    setGenerating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-health-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate plan");
      }

      const result = await response.json();
      
      await fetchPlans();
      toast.success("Health plan generated successfully!");
      return result.plan;
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate plan");
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const updatePlanStatus = async (planId: string, status: "active" | "paused" | "completed") => {
    try {
      const { error } = await supabase
        .from("health_plans")
        .update({ status })
        .eq("id", planId);

      if (error) throw error;

      await fetchPlans();
      toast.success(`Plan ${status}`);
    } catch (error) {
      console.error("Error updating plan status:", error);
      toast.error("Failed to update plan");
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("health_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      setPlans((prev) => prev.filter((p) => p.id !== planId));
      if (activePlan?.id === planId) {
        setActivePlan(null);
      }
      toast.success("Plan deleted");
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to delete plan");
    }
  };

  return {
    plans,
    activePlan,
    loading,
    generating,
    generatePlan,
    updatePlanStatus,
    deletePlan,
    refreshPlans: fetchPlans,
  };
}
