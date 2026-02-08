import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateDocumentAnalysis, createValidationErrorResponse } from "../_shared/validation.ts";

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

    // Validate input data
    const rawInput = await req.json();
    const validationResult = validateDocumentAnalysis(rawInput);
    
    if (!validationResult.valid) {
      return createValidationErrorResponse(validationResult.errors!, corsHeaders);
    }
    
    const { documentId, documentContent, documentType, fileName } = validationResult.data as {
      documentId: string;
      documentContent: string;
      documentType: string;
      fileName: string;
    };

    // Use AI to analyze the document
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
            content: `You are a medical document analyzer. Analyze the following medical document and extract structured information.
            
Return a JSON object with this exact structure:
{
  "summary": "A concise 2-3 sentence summary of the document",
  "extractedData": {
    "medicines": [{"name": "string", "dosage": "string", "frequency": "string", "instructions": "string"}],
    "diagnoses": ["string"],
    "labValues": [{"name": "string", "value": "string", "unit": "string", "status": "normal/high/low"}],
    "recommendations": ["string"],
    "doctorNotes": "string"
  },
  "suggestedReminders": [
    {"medicineName": "string", "dosage": "string", "frequency": "daily/twice_daily/thrice_daily", "times": ["08:00", "20:00"], "instructions": "string"}
  ]
}

Be thorough but only include information actually present in the document. For medicines, suggest appropriate timing based on common medical practices.`
          },
          {
            role: "user",
            content: `Document Type: ${documentType}
File Name: ${fileName}

Document Content:
${documentContent}

Please analyze this medical document and extract all relevant health information.`
          }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
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

    const aiResponse = await response.json();
    const analysisResult = JSON.parse(aiResponse.choices[0].message.content);

    // Update the document with AI analysis
    const { error: updateError } = await supabase
      .from("medical_documents")
      .update({
        ai_summary: analysisResult.summary,
        ai_extracted_data: analysisResult.extractedData,
        processed_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document:", updateError);
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Document analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
