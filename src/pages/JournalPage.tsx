import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function JournalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [moodRating, setMoodRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user || !title.trim() || !content.trim() || moodRating === 0) {
      toast.error("Please fill in all fields and select a mood rating.");
      return;
    }
    setSaving(true);

    try {
      // First save the journal
      const { data: journal, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          mood_rating: moodRating,
        })
        .select()
        .single();

      if (error) throw error;

      // Then analyze with AI
      const resp = await supabase.functions.invoke("analyze-journal", {
        body: { journalId: journal.id, content: content.trim(), moodRating, userId: user.id },
      });

      if (resp.data) {
        setAiResponse(resp.data.response);
        // Update the journal with AI analysis
        await supabase
          .from("journal_entries")
          .update({
            ai_sentiment: resp.data.sentiment,
            ai_mood_score: resp.data.moodScore,
            ai_response: resp.data.response,
          })
          .eq("id", journal.id);
      }

      toast.success("Journal saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save journal");
    }
    setSaving(false);
  };

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground mb-6">New Journal Entry</h1>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="rounded-xl h-11"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">How are you feeling?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setMoodRating(n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    n <= moodRating ? "text-foreground fill-foreground" : "text-border hover:text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Journal</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day, your thoughts, your feelings..."
            className="rounded-xl min-h-[200px] resize-none"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !title.trim() || !content.trim() || moodRating === 0}
          className="w-full rounded-xl h-11"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Analyzing & Saving..." : "Save Entry"}
        </Button>

        {aiResponse && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 shadow-card"
          >
            <p className="text-xs text-muted-foreground mb-2 font-medium">AI Response</p>
            <p className="text-sm text-foreground leading-relaxed">{aiResponse}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => {
                setTitle("");
                setContent("");
                setMoodRating(0);
                setAiResponse(null);
                navigate("/app/stats");
              }}
            >
              View Statistics
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
