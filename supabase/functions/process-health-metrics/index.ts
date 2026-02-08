import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateHealthMetrics, createValidationErrorResponse } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ThresholdConfig {
  bp_systolic_high: number;
  bp_systolic_low: number;
  bp_diastolic_high: number;
  bp_diastolic_low: number;
  sugar_high: number;
  sugar_low: number;
  heart_rate_high: number;
  heart_rate_low: number;
  oxygen_low: number;
}

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  bp_systolic_high: 140,
  bp_systolic_low: 90,
  bp_diastolic_high: 90,
  bp_diastolic_low: 60,
  sugar_high: 180,
  sugar_low: 70,
  heart_rate_high: 100,
  heart_rate_low: 60,
  oxygen_low: 92,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    
    // Validate input data
    const rawInput = await req.json();
    const validationResult = validateHealthMetrics(rawInput);
    
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.errors!, corsHeaders);
    }
    
    const metrics = validationResult.data!;

    // Get user profile for personalized thresholds
    const { data: profile } = await supabase
      .from("profiles")
      .select("health_conditions")
      .eq("user_id", userId)
      .single();

    // Adjust thresholds based on conditions (e.g., diabetics have different sugar thresholds)
    const thresholds = { ...DEFAULT_THRESHOLDS };
    if (profile?.health_conditions?.includes("Diabetes")) {
      thresholds.sugar_high = 140; // More strict for diabetics
    }
    if (profile?.health_conditions?.includes("Hypertension")) {
      thresholds.bp_systolic_high = 130;
      thresholds.bp_diastolic_high = 80;
    }

    // Insert the health metric
    const { data: metricData, error: metricError } = await supabase
      .from("health_metrics")
      .insert({
        user_id: userId,
        device_id: metrics.device_id || null,
        heart_rate: metrics.heart_rate,
        blood_pressure_systolic: metrics.blood_pressure_systolic,
        blood_pressure_diastolic: metrics.blood_pressure_diastolic,
        blood_sugar: metrics.blood_sugar,
        steps: metrics.steps || 0,
        calories: metrics.calories || 0,
        oxygen_saturation: metrics.oxygen_saturation,
        body_temperature: metrics.body_temperature,
        recorded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (metricError) {
      throw metricError;
    }

    // Check for alerts
    const alerts: any[] = [];

    // Blood Pressure checks
    if (metrics.blood_pressure_systolic && metrics.blood_pressure_diastolic) {
      if (metrics.blood_pressure_systolic > thresholds.bp_systolic_high || 
          metrics.blood_pressure_diastolic > thresholds.bp_diastolic_high) {
        const severity = metrics.blood_pressure_systolic > 180 || metrics.blood_pressure_diastolic > 120 
          ? "critical" : "warning";
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "bp_high",
          severity,
          title: "High Blood Pressure Detected",
          message: `Your BP is ${metrics.blood_pressure_systolic}/${metrics.blood_pressure_diastolic} mmHg, which is above normal range.`,
          suggestion: generateBPHighSuggestion(severity),
          nearby_locations: generateNearbyLocations("hospital"),
        });
      } else if (metrics.blood_pressure_systolic < thresholds.bp_systolic_low || 
                 metrics.blood_pressure_diastolic < thresholds.bp_diastolic_low) {
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "bp_low",
          severity: "warning",
          title: "Low Blood Pressure Detected",
          message: `Your BP is ${metrics.blood_pressure_systolic}/${metrics.blood_pressure_diastolic} mmHg, which is below normal range.`,
          suggestion: "Drink water, eat something salty, and lie down if you feel dizzy. Avoid sudden movements.",
          nearby_locations: generateNearbyLocations("hospital"),
        });
      }
    }

    // Blood Sugar checks
    if (metrics.blood_sugar) {
      if (metrics.blood_sugar > thresholds.sugar_high) {
        const severity = metrics.blood_sugar > 250 ? "critical" : "warning";
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "sugar_high",
          severity,
          title: "High Blood Sugar Detected",
          message: `Your blood sugar is ${metrics.blood_sugar} mg/dL, which is above normal.`,
          suggestion: generateSugarHighSuggestion(severity),
          nearby_locations: generateNearbyLocations("food"),
        });
      } else if (metrics.blood_sugar < thresholds.sugar_low) {
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "sugar_low",
          severity: metrics.blood_sugar < 54 ? "critical" : "warning",
          title: "Low Blood Sugar Detected",
          message: `Your blood sugar is ${metrics.blood_sugar} mg/dL, which is below normal.`,
          suggestion: "Eat or drink 15-20 grams of fast-acting carbs like fruit juice, glucose tablets, or candy. Recheck in 15 minutes.",
          nearby_locations: generateNearbyLocations("food"),
        });
      }
    }

    // Heart Rate checks
    if (metrics.heart_rate) {
      if (metrics.heart_rate > thresholds.heart_rate_high) {
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "heart_rate_high",
          severity: metrics.heart_rate > 150 ? "critical" : "warning",
          title: "High Heart Rate Detected",
          message: `Your heart rate is ${metrics.heart_rate} bpm, which is elevated.`,
          suggestion: "Rest in a comfortable position, practice deep breathing, and avoid caffeine. If accompanied by chest pain, seek immediate medical attention.",
          nearby_locations: generateNearbyLocations("hospital"),
        });
      } else if (metrics.heart_rate < thresholds.heart_rate_low) {
        alerts.push({
          user_id: userId,
          metric_id: metricData.id,
          alert_type: "heart_rate_low",
          severity: metrics.heart_rate < 40 ? "critical" : "warning",
          title: "Low Heart Rate Detected",
          message: `Your heart rate is ${metrics.heart_rate} bpm, which is below normal.`,
          suggestion: "Monitor for symptoms like dizziness or fatigue. If you feel unwell, consult a healthcare provider.",
          nearby_locations: generateNearbyLocations("hospital"),
        });
      }
    }

    // Oxygen Saturation check
    if (metrics.oxygen_saturation && metrics.oxygen_saturation < thresholds.oxygen_low) {
      alerts.push({
        user_id: userId,
        metric_id: metricData.id,
        alert_type: "oxygen_low",
        severity: metrics.oxygen_saturation < 88 ? "emergency" : "critical",
        title: "Low Oxygen Saturation",
        message: `Your oxygen level is ${metrics.oxygen_saturation}%, which requires attention.`,
        suggestion: "Sit upright, practice pursed-lip breathing, and get fresh air. If below 90%, seek immediate medical attention.",
        nearby_locations: generateNearbyLocations("hospital"),
      });
    }

    // Insert alerts if any
    if (alerts.length > 0) {
      const { error: alertError } = await supabase
        .from("health_alerts")
        .insert(alerts);
      
      if (alertError) {
        console.error("Error inserting alerts:", alertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        metric: metricData,
        alerts: alerts.map(a => ({ type: a.alert_type, severity: a.severity, title: a.title })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Process metrics error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateBPHighSuggestion(severity: string): string {
  if (severity === "critical") {
    return "⚠️ URGENT: Your blood pressure is dangerously high. Rest immediately, avoid physical activity, and consider calling emergency services if you experience severe headache, chest pain, or vision problems.";
  }
  return "Take deep breaths, rest for 10 minutes, and avoid caffeine and salt. Consider eating potassium-rich foods like bananas, spinach, or sweet potatoes. Monitor and consult your doctor if this persists.";
}

function generateSugarHighSuggestion(severity: string): string {
  if (severity === "critical") {
    return "⚠️ URGENT: Your blood sugar is very high. Check for ketones if possible, drink water, avoid carbs, and contact your healthcare provider immediately.";
  }
  return "Take a 15-minute walk if possible. Eat low-glycemic foods like leafy greens, legumes, or nuts. Avoid sugary drinks and processed foods. Stay hydrated with water.";
}

function generateNearbyLocations(type: "hospital" | "food"): any[] {
  if (type === "hospital") {
    return [
      { name: "City Medical Center", address: "123 Health Ave", distance: "0.5 km", phone: "+1-800-MEDICAL" },
      { name: "HealthPlus Urgent Care", address: "456 Wellness Blvd", distance: "1.2 km", phone: "+1-800-HEALTH" },
      { name: "Community Hospital", address: "789 Care Street", distance: "2.0 km", phone: "+1-800-HOSPITAL" },
    ];
  }
  return [
    { name: "Organic Health Cafe", address: "100 Green Lane", distance: "0.3 km", type: "Healthy Restaurant" },
    { name: "Fresh & Fit Market", address: "200 Wellness Way", distance: "0.7 km", type: "Health Food Store" },
    { name: "Natural Foods Co-op", address: "300 Nutrition Ave", distance: "1.1 km", type: "Organic Market" },
  ];
}
