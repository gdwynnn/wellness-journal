import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch user's recent journals for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let journalContext = "";
    if (userId) {
      const { data: journals } = await supabase
        .from("journal_entries")
        .select("title, content, mood_rating, ai_sentiment, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (journals && journals.length > 0) {
        journalContext = "\n\nUser's recent journal entries for context:\n" +
          journals.map((j: any) => `- [${j.created_at}] "${j.title}" (mood: ${j.mood_rating}/5): ${j.content.substring(0, 200)}`).join("\n");
      }
    }

    const systemPrompt = `You are a compassionate and supportive wellness assistant for the "Wellness Journal" app. Your purpose is to help users with their mental health and emotional wellbeing.

RULES:
- Only discuss topics related to mental health, wellness, emotions, self-care, mindfulness, and personal growth.
- If the user asks about unrelated topics (coding, math, news, etc.), politely decline and redirect to wellness topics.
- If the user uses offensive, harmful, or inappropriate language, respond calmly that such language isn't appropriate and offer to help with wellness-related concerns instead.
- Base your responses on the user's journal entries when available.
- Be empathetic, warm, and encouraging. Never diagnose medical conditions.
- Suggest professional help when concerns seem serious.
- Keep responses concise but helpful.${journalContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
