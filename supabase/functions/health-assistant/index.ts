import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateChatRequest, createValidationErrorResponse } from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HealthContext {
  profile: any;
  recentMetrics: any[];
  recentAlerts: any[];
  medicalDocuments: any[];
  healthPlans: any[];
  medicineReminders: any[];
  mobileHealthData: any[];
  digitalWellness: any[];
  globalHealthMemory: any;
  location: { latitude: number; longitude: number; city?: string } | null;
}

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
    const validationResult = validateChatRequest(rawInput);
    
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.errors!, corsHeaders);
    }
    
    const { messages, conversationId, queryType, location } = validationResult.data as {
      messages: Array<{ role: string; content: string }>;
      conversationId?: string;
      queryType?: string;
      location?: { latitude: number; longitude: number; city?: string };
    };

    // Fetch comprehensive user health context including global memory
    const [profileResult, metricsResult, alertsResult, documentsResult, plansResult, remindersResult, mobileHealthResult, wellnessResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).single(),
      supabase.from("health_metrics").select("*").eq("user_id", userId).order("recorded_at", { ascending: false }).limit(10),
      supabase.from("health_alerts").select("*").eq("user_id", userId).order("triggered_at", { ascending: false }).limit(5),
      supabase.from("medical_documents").select("*").eq("user_id", userId).order("uploaded_at", { ascending: false }).limit(10),
      supabase.from("health_plans").select("*").eq("user_id", userId).eq("status", "active").limit(1),
      supabase.from("medicine_reminders").select("*").eq("user_id", userId).eq("is_active", true),
      supabase.from("mobile_health_data").select("*").eq("user_id", userId).order("recorded_date", { ascending: false }).limit(7),
      supabase.from("digital_wellness").select("*").eq("user_id", userId).order("recorded_date", { ascending: false }).limit(7),
    ]);

    const healthContext: HealthContext = {
      profile: profileResult.data,
      recentMetrics: metricsResult.data || [],
      recentAlerts: alertsResult.data || [],
      medicalDocuments: documentsResult.data || [],
      healthPlans: plansResult.data || [],
      medicineReminders: remindersResult.data || [],
      mobileHealthData: mobileHealthResult.data || [],
      digitalWellness: wellnessResult.data || [],
      globalHealthMemory: profileResult.data?.health_memory || {},
      location: location || null,
    };

    // Build system prompt with health context and global memory
    const systemPrompt = buildSystemPrompt(healthContext, queryType);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Health assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildSystemPrompt(context: HealthContext, queryType?: string): string {
  const { profile, recentMetrics, recentAlerts, medicalDocuments, healthPlans, medicineReminders, mobileHealthData, digitalWellness, globalHealthMemory, location } = context;
  
  let healthSummary = "";
  if (profile) {
    const conditions = profile.health_conditions?.length > 0 
      ? profile.health_conditions.join(", ") 
      : "None reported";
    const problems = profile.physical_problems?.length > 0 
      ? profile.physical_problems.join(", ") 
      : "None reported";
    
    healthSummary = `
User Profile:
- Name: ${profile.first_name || "User"} ${profile.last_name || ""}
- Age: ${profile.date_of_birth ? calculateAge(profile.date_of_birth) : "Unknown"}
- Gender: ${profile.gender || "Unknown"}
- Blood Type: ${profile.blood_type || "Unknown"}
- Height: ${profile.height_cm ? profile.height_cm + " cm" : "Unknown"}
- Weight: ${profile.weight_kg ? profile.weight_kg + " kg" : "Unknown"}
- Health Conditions: ${conditions}
- Physical Problems: ${problems}
- Food Preference: ${profile.food_preference || "No preference"}
- Activity Level: ${profile.activity_level || "Unknown"}
- Daily Routine: ${profile.daily_routine || "Unknown"}
- Smoking: ${profile.smoking_status || "Unknown"}
- Alcohol: ${profile.alcohol_consumption || "Unknown"}
- Lifestyle Summary: ${profile.lifestyle_summary || "Not available"}
- Health Score: ${profile.health_score || 0}/100
- Health Risk Level: ${profile.health_risk_level || "Unknown"}
`;
  }

  // Global Health Memory - persistent across all conversations
  let globalMemoryInfo = "";
  if (globalHealthMemory && Object.keys(globalHealthMemory).length > 0) {
    globalMemoryInfo = `
GLOBAL HEALTH MEMORY (Important long-term context):
- Key Health Insights: ${globalHealthMemory.insights?.slice(-5).join("; ") || "None yet"}
- Report Summaries: ${globalHealthMemory.reportSummaries?.slice(-3).join("; ") || "None yet"}
- Lifestyle Patterns: ${globalHealthMemory.lifestylePatterns?.slice(-3).join("; ") || "None yet"}
- Important Health Decisions: ${globalHealthMemory.conditions?.join("; ") || "None recorded"}
`;
  }

  let metricsInfo = "";
  if (recentMetrics.length > 0) {
    const latest = recentMetrics[0];
    metricsInfo = `
Recent Health Metrics (Latest):
- Heart Rate: ${latest.heart_rate || "N/A"} bpm
- Blood Pressure: ${latest.blood_pressure_systolic || "N/A"}/${latest.blood_pressure_diastolic || "N/A"} mmHg
- Blood Sugar: ${latest.blood_sugar || "N/A"} mg/dL
- Steps Today: ${latest.steps || 0}
- Calories Burned: ${latest.calories || 0} kcal
- Oxygen Saturation: ${latest.oxygen_saturation || "N/A"}%
`;
  }

  let alertsInfo = "";
  if (recentAlerts.length > 0) {
    alertsInfo = `
Recent Health Alerts:
${recentAlerts.map(a => `- ${a.title}: ${a.message}`).join("\n")}
`;
  }

  let documentsInfo = "";
  if (medicalDocuments.length > 0) {
    documentsInfo = `
Uploaded Medical Documents (User's Reports):
${medicalDocuments.map(doc => {
  let docInfo = `- ${doc.document_type || "Document"}: ${doc.file_name}`;
  if (doc.ai_summary) {
    docInfo += `\n  Summary: ${doc.ai_summary}`;
  }
  if (doc.ai_extracted_data?.diagnoses?.length > 0) {
    docInfo += `\n  Diagnoses: ${doc.ai_extracted_data.diagnoses.join(", ")}`;
  }
  if (doc.ai_extracted_data?.medicines?.length > 0) {
    docInfo += `\n  Prescribed Medicines: ${doc.ai_extracted_data.medicines.map((m: any) => `${m.name} (${m.dosage})`).join(", ")}`;
  }
  if (doc.ai_extracted_data?.labValues?.length > 0) {
    docInfo += `\n  Lab Values: ${doc.ai_extracted_data.labValues.map((l: any) => `${l.name}: ${l.value} ${l.unit} (${l.status})`).join(", ")}`;
  }
  return docInfo;
}).join("\n")}
`;
  }

  let plansInfo = "";
  if (healthPlans.length > 0) {
    const activePlan = healthPlans[0];
    plansInfo = `
Active Health Plan:
- Name: ${activePlan.plan_name}
- Type: ${activePlan.plan_type}
- Duration: ${activePlan.duration_days} days
- AI Recommendations: ${activePlan.ai_recommendations || "Following personalized plan"}
`;
  }

  let remindersInfo = "";
  if (medicineReminders.length > 0) {
    remindersInfo = `
Active Medicine Reminders:
${medicineReminders.map(r => `- ${r.medicine_name} (${r.dosage || "as prescribed"}): ${r.times_of_day?.join(", ") || "scheduled"} - ${r.frequency}`).join("\n")}
`;
  }

  let mobileHealthInfo = "";
  if (mobileHealthData.length > 0) {
    const latest = mobileHealthData[0];
    const weeklyAvgSteps = Math.round(mobileHealthData.reduce((sum, d) => sum + (d.steps || 0), 0) / mobileHealthData.length);
    mobileHealthInfo = `
Mobile Activity Data (Live from Device):
- Today's Steps: ${latest.steps || 0}
- Distance: ${((latest.distance_meters || 0) / 1000).toFixed(1)} km
- Calories Burned: ${latest.calories_burned || 0} kcal
- Active Minutes: ${latest.active_minutes || 0}
- Movement Score: ${latest.movement_score || 0}/100
- 7-Day Average Steps: ${weeklyAvgSteps}
`;
  }

  let wellnessInfo = "";
  if (digitalWellness.length > 0) {
    const latest = digitalWellness[0];
    wellnessInfo = `
Digital Wellness (Behavioral Patterns):
- Screen Time: ${latest.screen_time_minutes || 0} minutes/day
- Focus Stability: ${latest.focus_stability || "Unknown"}
- Sleep Consistency: ${latest.sleep_consistency || "Unknown"}
- Stress Level: ${latest.stress_level || "Unknown"}
- Late Night Activity: ${latest.late_night_minutes || 0} minutes after 11 PM
`;
  }

  let locationInfo = "";
  if (location) {
    locationInfo = `
User Location:
- City: ${location.city || "Unknown"}
- Coordinates: ${location.latitude}, ${location.longitude}
`;
  }

  return `You are a personalized AI health assistant with access to the user's complete health profile, medical documents, uploaded reports, activity data, and long-term health memory. You provide safe, personalized health guidance while maintaining context across all conversations.

CORE CAPABILITIES:
1. **Report Analysis**: You can read and understand uploaded medical reports, prescriptions, and lab results. Summarize key findings and explain them in simple terms.
2. **Health Plan Generation**: Help create personalized 7-day, 14-day, or 30-day health plans including diet (with dietary preference support), activity, sleep, and medicine schedules.
3. **Medicine Reminders**: Help set up alarm-style medicine reminders that repeat until acknowledged.
4. **Preventive Guidance**: Use all available data to provide proactive health advice.
5. **Food & Exercise Recommendations**: Suggest healthy alternatives, recipes (with YouTube links), and safe exercises for their conditions.

IMPORTANT GUIDELINES:
1. NEVER provide medical diagnoses or prescribe new medications
2. Always recommend consulting healthcare professionals for serious concerns
3. Reference uploaded medical documents and their AI summaries when giving advice
4. Consider their physical problems when recommending exercises - block unsafe activities automatically
5. For recipes, consider their food preferences (diabetic-friendly, vegetarian, low-carb, etc.)
6. If they ask for unhealthy food, explain why it's not ideal and suggest healthier alternatives
7. Include actionable links: Google Maps for clinics/restaurants, YouTube for exercise tutorials and recipes
8. When stress is high or sleep is poor, suggest: screen breaks, early dinner, light walks, calming foods
9. Track important health insights in your responses for future reference
10. Be conversational but concise - avoid overly long responses unless details are requested

SPECIAL COMMANDS THE USER MIGHT USE:
- "Upload a report" or "Analyze my report" → Help them understand uploaded documents
- "Create a health plan" or "7-day plan" → Generate personalized health plans
- "Set a reminder" or "Medicine reminder" → Help create medicine alarms
- "Download my plan" → Remind them they can download plans as PDF

${globalMemoryInfo}
${healthSummary}
${metricsInfo}
${alertsInfo}
${documentsInfo}
${plansInfo}
${remindersInfo}
${mobileHealthInfo}
${wellnessInfo}
${locationInfo}

Respond in a friendly, supportive manner. Format responses with markdown for better readability. Always consider the user's complete health picture from their global memory and current data when giving advice.`;
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
