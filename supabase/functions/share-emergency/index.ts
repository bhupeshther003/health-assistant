import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateEmergencyShare, createValidationErrorResponse } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const validationResult = validateEmergencyShare(rawInput);
    
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.errors!, corsHeaders);
    }
    
    const body = validationResult.data as {
      alert_id: string;
      hospital_name: string;
      hospital_address: string;
      hospital_phone?: string;
      latitude: number;
      longitude: number;
    };

    // Get user's profile and latest health metrics for the health snapshot
    const [profileResult, metricsResult, alertResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("health_metrics").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(1),
      supabase.from("health_alerts").select("*").eq("id", body.alert_id).single(),
    ]);

    const profile = profileResult.data;
    const latestMetric = metricsResult.data?.[0];
    const alert = alertResult.data;

    // Build health snapshot
    const healthSnapshot = {
      timestamp: new Date().toISOString(),
      patient: {
        name: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Unknown",
        age: profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null,
        gender: profile?.gender,
        blood_type: profile?.blood_type,
        emergency_contacts: profile?.emergency_contacts || [],
      },
      conditions: profile?.health_conditions || [],
      physical_problems: profile?.physical_problems || [],
      allergies: profile?.allergies || [],
      medications: profile?.medications || [],
      current_vitals: latestMetric ? {
        heart_rate: latestMetric.heart_rate,
        blood_pressure: `${latestMetric.blood_pressure_systolic}/${latestMetric.blood_pressure_diastolic}`,
        blood_sugar: latestMetric.blood_sugar,
        oxygen_saturation: latestMetric.oxygen_saturation,
        body_temperature: latestMetric.body_temperature,
      } : null,
      alert: alert ? {
        type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        triggered_at: alert.triggered_at,
      } : null,
    };

    // Get user's current location
    const userLocation = {
      latitude: profile?.latitude || body.latitude,
      longitude: profile?.longitude || body.longitude,
      city: profile?.location_city,
      state: profile?.location_state,
      country: profile?.location_country,
    };

    // Create emergency share record
    const { data: shareData, error: shareError } = await supabase
      .from("emergency_shares")
      .insert({
        user_id: userId,
        alert_id: body.alert_id,
        hospital_name: body.hospital_name,
        hospital_address: body.hospital_address,
        hospital_phone: body.hospital_phone,
        latitude: body.latitude,
        longitude: body.longitude,
        user_location: userLocation,
        health_snapshot: healthSnapshot,
        status: "pending",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single();

    if (shareError) {
      throw shareError;
    }

    // Update the alert to mark as emergency shared
    if (body.alert_id) {
      await supabase
        .from("health_alerts")
        .update({ emergency_shared: true })
        .eq("id", body.alert_id);
    }

    // In a real implementation, this would send notifications to:
    // 1. The hospital via API/SMS/Email
    // 2. Emergency contacts via SMS
    // 3. Local emergency services if configured

    return new Response(
      JSON.stringify({
        success: true,
        share_id: shareData.id,
        message: "Emergency information shared successfully",
        shared_with: {
          hospital: body.hospital_name,
          address: body.hospital_address,
        },
        health_snapshot: healthSnapshot,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Emergency share error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
