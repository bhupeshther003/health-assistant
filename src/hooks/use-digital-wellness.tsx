import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

// Digital wellness metrics derived from behavioral patterns
// Future scope: Real smartwatch/device integration via adapters
interface DigitalWellnessMetric {
  id: string;
  user_id: string;
  recorded_date: string;
  screen_time_minutes: number;
  unlock_count: number;
  app_switch_count: number;
  late_night_minutes: number;
  focus_stability: "stable" | "moderate" | "low";
  sleep_consistency: "consistent" | "irregular";
  stress_level: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

interface WellnessTrend {
  direction: "up" | "down" | "stable";
  percentage: number;
}

interface DerivedMetrics {
  screenTime: {
    minutes: number;
    trend: WellnessTrend;
    riskLevel: "low" | "moderate" | "high";
  };
  focusStability: {
    level: "stable" | "moderate" | "low";
    unlockCount: number;
    appSwitchCount: number;
  };
  sleepConsistency: {
    level: "consistent" | "irregular";
    lateNightMinutes: number;
    sleepWindow: string;
  };
  stressLevel: {
    level: "low" | "medium" | "high";
    trend: WellnessTrend;
    factors: string[];
  };
  lateNightActivity: {
    minutes: number;
    healthImpact: string;
  };
}

export function useDigitalWellness() {
  const { user } = useAuth();
  const [todayMetric, setTodayMetric] = useState<DigitalWellnessMetric | null>(null);
  const [weekMetrics, setWeekMetrics] = useState<DigitalWellnessMetric[]>([]);
  const [derivedMetrics, setDerivedMetrics] = useState<DerivedMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateTrend = (current: number, previous: number): WellnessTrend => {
    if (previous === 0) return { direction: "stable", percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      percentage: Math.abs(Math.round(change)),
    };
  };

  const deriveMetrics = useCallback((today: DigitalWellnessMetric | null, week: DigitalWellnessMetric[]) => {
    if (!today) {
      // Return default metrics for new users
      setDerivedMetrics({
        screenTime: {
          minutes: 0,
          trend: { direction: "stable", percentage: 0 },
          riskLevel: "low",
        },
        focusStability: {
          level: "stable",
          unlockCount: 0,
          appSwitchCount: 0,
        },
        sleepConsistency: {
          level: "consistent",
          lateNightMinutes: 0,
          sleepWindow: "11 PM - 7 AM",
        },
        stressLevel: {
          level: "low",
          trend: { direction: "stable", percentage: 0 },
          factors: [],
        },
        lateNightActivity: {
          minutes: 0,
          healthImpact: "Great sleep hygiene!",
        },
      });
      return;
    }

    const yesterdayMetric = week.find(
      (m) => new Date(m.recorded_date).toDateString() === 
        new Date(Date.now() - 86400000).toDateString()
    );

    // Derive screen time risk level
    const screenTimeRisk: "low" | "moderate" | "high" = 
      today.screen_time_minutes > 480 ? "high" :
      today.screen_time_minutes > 300 ? "moderate" : "low";

    // Calculate stress factors
    const stressFactors: string[] = [];
    if (today.screen_time_minutes > 360) stressFactors.push("High screen time");
    if (today.late_night_minutes > 60) stressFactors.push("Late-night activity");
    if (today.focus_stability === "low") stressFactors.push("Focus disruption");

    // Health impact message for late night activity
    let healthImpact = "Great sleep hygiene!";
    if (today.late_night_minutes > 120) {
      healthImpact = "Consider winding down earlier for better recovery";
    } else if (today.late_night_minutes > 60) {
      healthImpact = "Moderate late activity - aim for earlier wind-down";
    } else if (today.late_night_minutes > 0) {
      healthImpact = "Light evening activity detected";
    }

    setDerivedMetrics({
      screenTime: {
        minutes: today.screen_time_minutes,
        trend: calculateTrend(
          today.screen_time_minutes,
          yesterdayMetric?.screen_time_minutes || today.screen_time_minutes
        ),
        riskLevel: screenTimeRisk,
      },
      focusStability: {
        level: today.focus_stability,
        unlockCount: today.unlock_count,
        appSwitchCount: today.app_switch_count,
      },
      sleepConsistency: {
        level: today.sleep_consistency,
        lateNightMinutes: today.late_night_minutes,
        sleepWindow: today.late_night_minutes > 60 ? "Late to bed" : "11 PM - 7 AM",
      },
      stressLevel: {
        level: today.stress_level,
        trend: calculateTrend(
          today.stress_level === "high" ? 3 : today.stress_level === "medium" ? 2 : 1,
          yesterdayMetric ? 
            (yesterdayMetric.stress_level === "high" ? 3 : 
             yesterdayMetric.stress_level === "medium" ? 2 : 1) : 1
        ),
        factors: stressFactors,
      },
      lateNightActivity: {
        minutes: today.late_night_minutes,
        healthImpact,
      },
    });
  }, []);

  const fetchWellnessData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("digital_wellness")
        .select("*")
        .eq("user_id", user.id)
        .gte("recorded_date", weekAgo)
        .order("recorded_date", { ascending: false });

      if (error) throw error;

      const metrics = (data || []) as DigitalWellnessMetric[];
      setWeekMetrics(metrics);

      const todayData = metrics.find((m) => m.recorded_date === today);
      setTodayMetric(todayData || null);

      deriveMetrics(todayData || null, metrics);
    } catch (error) {
      console.error("Error fetching wellness data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, deriveMetrics]);

  useEffect(() => {
    fetchWellnessData();
  }, [fetchWellnessData]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("digital_wellness_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "digital_wellness",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchWellnessData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWellnessData]);

  const recordWellnessMetric = async (metric: Partial<DigitalWellnessMetric>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const today = new Date().toISOString().split("T")[0];

    // Derive focus stability based on unlock/app switch counts
    let focusStability: "stable" | "moderate" | "low" = "stable";
    if ((metric.unlock_count || 0) > 50 || (metric.app_switch_count || 0) > 100) {
      focusStability = "low";
    } else if ((metric.unlock_count || 0) > 25 || (metric.app_switch_count || 0) > 50) {
      focusStability = "moderate";
    }

    // Derive sleep consistency based on late night activity
    const sleepConsistency: "consistent" | "irregular" = 
      (metric.late_night_minutes || 0) > 120 ? "irregular" : "consistent";

    // Derive stress level based on combined factors
    let stressLevel: "low" | "medium" | "high" = "low";
    const screenTimeHigh = (metric.screen_time_minutes || 0) > 360;
    const lateNightHigh = (metric.late_night_minutes || 0) > 60;
    const focusLow = focusStability === "low";

    if ((screenTimeHigh && lateNightHigh) || (focusLow && lateNightHigh)) {
      stressLevel = "high";
    } else if (screenTimeHigh || lateNightHigh || focusLow) {
      stressLevel = "medium";
    }

    const { data, error } = await supabase
      .from("digital_wellness")
      .upsert({
        user_id: user.id,
        recorded_date: today,
        screen_time_minutes: metric.screen_time_minutes || 0,
        unlock_count: metric.unlock_count || 0,
        app_switch_count: metric.app_switch_count || 0,
        late_night_minutes: metric.late_night_minutes || 0,
        focus_stability: focusStability,
        sleep_consistency: sleepConsistency,
        stress_level: stressLevel,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,recorded_date",
      })
      .select()
      .single();

    if (!error) {
      await fetchWellnessData();
    }

    return { data, error };
  };

  // Generate simulated metrics for demo purposes
  // Future scope: Replace with real device/sensor data adapters
  const generateDemoMetrics = async () => {
    const demoData = {
      screen_time_minutes: Math.floor(Math.random() * 300) + 120,
      unlock_count: Math.floor(Math.random() * 40) + 10,
      app_switch_count: Math.floor(Math.random() * 80) + 20,
      late_night_minutes: Math.floor(Math.random() * 60),
    };

    return recordWellnessMetric(demoData);
  };

  return {
    todayMetric,
    weekMetrics,
    derivedMetrics,
    loading,
    recordWellnessMetric,
    generateDemoMetrics,
    refreshWellness: fetchWellnessData,
  };
}
