import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { journalId, content, moodRating, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch recent journals for context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let recentContext = "";
    if (userId) {
      const { data: recent } = await supabase
        .from("journal_entries")
        .select("title, content, mood_rating, created_at")
        .eq("user_id", userId)
        .neq("id", journalId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent && recent.length > 0) {
        recentContext = "\n\nRecent journal entries for context:\n" +
          recent.map((j: any) => `- "${j.title}" (mood: ${j.mood_rating}/5): ${j.content.substring(0, 150)}`).join("\n");
      }
    }

    const prompt = `Analyze this journal entry and provide:
1. A sentiment analysis (one short sentence describing the emotional tone)
2. A mood score from 0-100 (where 0 is extremely negative and 100 is extremely positive)
3. A supportive, empathetic response with advice or encouragement based on the entry content

The user rated their mood ${moodRating}/5 stars.

Journal entry:
"${content}"${recentContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a wellness journal AI assistant. Analyze journal entries for sentiment and provide supportive responses. Always be empathetic and kind." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_journal",
              description: "Return sentiment analysis, mood score, and supportive response for a journal entry.",
              parameters: {
                type: "object",
                properties: {
                  sentiment: { type: "string", description: "One-sentence sentiment analysis of the entry" },
                  moodScore: { type: "number", description: "Mood score from 0 to 100" },
                  response: { type: "string", description: "Supportive, empathetic response with advice or encouragement (2-4 sentences)" },
                },
                required: ["sentiment", "moodScore", "response"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_journal" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(args), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    return new Response(JSON.stringify({
      sentiment: "Analysis unavailable",
      moodScore: moodRating * 20,
      response: "Thank you for sharing. Keep journaling — it's a great step for your mental health!",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
