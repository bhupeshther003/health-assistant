import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateHealthPlanRequest, createValidationErrorResponse } from "../_shared/validation.ts";

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const validationResult = validateHealthPlanRequest(rawInput);
    
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.errors!, corsHeaders);
    }
    
    const { planType, duration, focusAreas } = validationResult.data as {
      planType: string;
      duration: number;
      focusAreas: string[];
    };

    // Fetch user context
    const [profileResult, documentsResult, metricsResult, wellnessResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("medical_documents").select("*").eq("user_id", userId).order("uploaded_at", { ascending: false }).limit(5),
      supabase.from("health_metrics").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(10),
      supabase.from("digital_wellness").select("*").eq("user_id", userId).order("recorded_date", { ascending: false }).limit(7),
    ]);

    const profile = profileResult.data;
    const documents = documentsResult.data || [];
    const metrics = metricsResult.data || [];
    const wellness = wellnessResult.data || [];

    // Build comprehensive health context
    const healthContext = buildHealthContext(profile, documents, metrics, wellness);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a personalized health plan generator. Create detailed, actionable health plans based on user data.

Return a JSON object with this exact structure:
{
  "planName": "string - descriptive name for the plan",
  "dietPlan": {
    "overview": "Brief overview of dietary goals",
    "dailyCalorieTarget": number,
    "macroTargets": {"protein": "g", "carbs": "g", "fat": "g"},
    "days": [
      {
        "day": 1,
        "meals": {
          "breakfast": {"name": "string", "description": "string", "calories": number, "time": "08:00"},
          "lunch": {"name": "string", "description": "string", "calories": number, "time": "13:00"},
          "dinner": {"name": "string", "description": "string", "calories": number, "time": "19:00"},
          "snacks": [{"name": "string", "time": "string"}]
        },
        "hydration": "8 glasses of water",
        "notes": "string"
      }
    ]
  },
  "activityPlan": {
    "overview": "Brief overview of activity goals",
    "weeklyTarget": "150 minutes moderate activity",
    "days": [
      {
        "day": 1,
        "exercises": [
          {"name": "string", "duration": "30 min", "intensity": "moderate", "time": "07:00", "instructions": "string"}
        ],
        "stepGoal": 8000,
        "restDay": false
      }
    ]
  },
  "sleepPlan": {
    "overview": "Brief overview of sleep goals",
    "targetHours": 8,
    "bedtime": "22:30",
    "wakeTime": "06:30",
    "tips": ["string"],
    "dailyRoutine": {
      "evening": ["Wind down at 21:00", "No screens after 21:30"],
      "morning": ["Wake naturally", "Get sunlight within 30 min"]
    }
  },
  "medicineSchedule": [
    {"name": "string", "dosage": "string", "times": ["08:00", "20:00"], "withFood": true, "notes": "string"}
  ],
  "aiRecommendations": "Personalized recommendations based on health profile",
  "weeklyGoals": ["string"],
  "progressMilestones": [{"week": 1, "goal": "string"}]
}

Consider the user's health conditions, activity level, food preferences, and recent health data when creating the plan.`
          },
          {
            role: "user",
            content: `Create a ${duration}-day personalized health plan.

Plan Type: ${planType}
Focus Areas: ${focusAreas.join(", ")}

User Health Context:
${healthContext}

Please create a comprehensive, safe, and achievable health plan tailored to this user's profile and health conditions.`
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const aiResponse = await response.json();
    const planData = JSON.parse(aiResponse.choices[0].message.content);

    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);

    // Save the plan to database
    const { data: savedPlan, error: saveError } = await supabase
      .from("health_plans")
      .insert({
        user_id: userId,
        plan_name: planData.planName,
        plan_type: planType,
        duration_days: duration,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        diet_plan: planData.dietPlan,
        activity_plan: planData.activityPlan,
        sleep_plan: planData.sleepPlan,
        medicine_schedule: planData.medicineSchedule,
        ai_recommendations: planData.aiRecommendations,
        based_on_documents: documents.map(d => d.id),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving plan:", saveError);
      throw new Error("Failed to save plan");
    }

    return new Response(JSON.stringify({ plan: savedPlan, details: planData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Health plan generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildHealthContext(profile: any, documents: any[], metrics: any[], wellness: any[]): string {
  let context = "";

  if (profile) {
    context += `
User Profile:
- Name: ${profile.first_name || "User"} ${profile.last_name || ""}
- Age: ${profile.date_of_birth ? calculateAge(profile.date_of_birth) : "Unknown"}
- Gender: ${profile.gender || "Unknown"}
- Height: ${profile.height_cm ? profile.height_cm + " cm" : "Unknown"}
- Weight: ${profile.weight_kg ? profile.weight_kg + " kg" : "Unknown"}
- Activity Level: ${profile.activity_level || "Unknown"}
- Food Preference: ${profile.food_preference || "No preference"}
- Health Conditions: ${(profile.health_conditions || []).join(", ") || "None reported"}
- Physical Problems: ${(profile.physical_problems || []).join(", ") || "None reported"}
- Current Medications: ${(profile.medications || []).join(", ") || "None"}
- Sleep Hours: ${profile.sleep_hours || "Unknown"}
- Smoking: ${profile.smoking_status || "Unknown"}
- Alcohol: ${profile.alcohol_consumption || "Unknown"}
`;
  }

  if (documents.length > 0) {
    context += "\nRecent Medical Documents:\n";
    documents.forEach(doc => {
      if (doc.ai_summary) {
        context += `- ${doc.document_type}: ${doc.ai_summary}\n`;
      }
    });
  }

  if (metrics.length > 0) {
    const latest = metrics[0];
    context += `
Recent Health Metrics:
- Heart Rate: ${latest.heart_rate || "N/A"} bpm
- Blood Pressure: ${latest.blood_pressure_systolic || "N/A"}/${latest.blood_pressure_diastolic || "N/A"} mmHg
- Blood Sugar: ${latest.blood_sugar || "N/A"} mg/dL
- Steps: ${latest.steps || 0}
`;
  }

  if (wellness.length > 0) {
    const latest = wellness[0];
    context += `
Digital Wellness:
- Screen Time: ${latest.screen_time_minutes || 0} min/day
- Focus Stability: ${latest.focus_stability || "Unknown"}
- Sleep Consistency: ${latest.sleep_consistency || "Unknown"}
- Stress Level: ${latest.stress_level || "Unknown"}
`;
  }

  return context;
}

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
