import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CalendarDays, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { format, formatDistanceToNow, startOfDay, parseISO } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood_rating: number;
  ai_sentiment: string | null;
  ai_mood_score: number | null;
  ai_response: string | null;
  created_at: string;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateJournals, setDateJournals] = useState<JournalEntry[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setJournals(data);
        });
    }
  }, [user]);

  const lastEntry = journals[0];
  const journalDates = new Set(journals.map((j) => format(parseISO(j.created_at), "yyyy-MM-dd")));

  // Mood chart data - group by day, average mood
  const moodData = Object.entries(
    journals.reduce((acc, j) => {
      const day = format(parseISO(j.created_at), "MMM dd");
      if (!acc[day]) acc[day] = [];
      acc[day].push(j.ai_mood_score ?? j.mood_rating * 20);
      return acc;
    }, {} as Record<string, number[]>)
  )
    .map(([day, scores]) => ({
      day,
      mood: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }))
    .reverse()
    .slice(-14);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    const entriesForDate = journals.filter((j) => format(parseISO(j.created_at), "yyyy-MM-dd") === dateStr);
    if (entriesForDate.length === 0) {
      toast.info("No journal entries for this date.");
    } else {
      setDateJournals(entriesForDate);
      setShowDialog(true);
    }
  };

  const recentJournals = journals.slice(0, 5);

  return (
    <div className="px-4 py-4 space-y-6 max-w-lg mx-auto">
      <h1 className="font-display text-xl font-bold text-foreground">Statistics</h1>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4 shadow-soft">
          <Clock className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Last Entry</p>
          <p className="text-sm font-semibold text-foreground">
            {lastEntry ? formatDistanceToNow(parseISO(lastEntry.created_at), { addSuffix: true }) : "No entries yet"}
          </p>
        </div>
        <div className="glass rounded-2xl p-4 shadow-soft">
          <CalendarDays className="w-4 h-4 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="text-sm font-semibold text-foreground">{journals.length}</p>
        </div>
      </div>

      {/* Mood Graph */}
      {moodData.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold text-foreground">Mood Trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={moodData}>
              <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Line type="monotone" dataKey="mood" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--foreground))" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Calendar */}
      <div className="glass rounded-2xl p-4 shadow-soft">
        <h2 className="font-display text-sm font-semibold text-foreground mb-3">Calendar</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={{ hasEntry: (date) => journalDates.has(format(date, "yyyy-MM-dd")) }}
          modifiersClassNames={{ hasEntry: "bg-foreground/10 font-bold" }}
          className="rounded-xl"
        />
      </div>

      {/* Recent Journals */}
      {recentJournals.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-sm font-semibold text-foreground">Recent Entries</h2>
          {recentJournals.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedJournal(j)}
              className="w-full text-left glass rounded-2xl p-4 shadow-soft transition-all hover:shadow-card"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-sm text-foreground">{j.title}</h3>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < j.mood_rating ? "text-foreground fill-foreground" : "text-border"}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{j.content}</p>
              {j.ai_sentiment && (
                <p className="text-xs text-muted-foreground italic">AI: {j.ai_sentiment}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">{format(parseISO(j.created_at), "MMM dd, yyyy h:mm a")}</p>
            </button>
          ))}
        </div>
      )}

      {/* Date Journals Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {dateJournals.map((j) => (
              <button
                key={j.id}
                onClick={() => { setShowDialog(false); setSelectedJournal(j); }}
                className="w-full text-left bg-secondary rounded-xl p-3 hover:bg-accent transition-colors"
              >
                <p className="font-medium text-sm">{j.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{j.content}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Journal Detail Dialog */}
      <Dialog open={!!selectedJournal} onOpenChange={() => setSelectedJournal(null)}>
        <DialogContent className="rounded-2xl">
          {selectedJournal && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{selectedJournal.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < selectedJournal.mood_rating ? "text-foreground fill-foreground" : "text-border"}`} />
                  ))}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedJournal.content}</p>
                {selectedJournal.ai_mood_score !== null && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground">AI Mood Score</p>
                    <p className="text-lg font-bold text-foreground">{selectedJournal.ai_mood_score}%</p>
                  </div>
                )}
                {selectedJournal.ai_sentiment && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">AI Sentiment</p>
                    <p className="text-sm text-foreground">{selectedJournal.ai_sentiment}</p>
                  </div>
                )}
                {selectedJournal.ai_response && (
                  <div className="bg-secondary rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">AI Response</p>
                    <p className="text-sm text-foreground">{selectedJournal.ai_response}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {format(parseISO(selectedJournal.created_at), "MMMM dd, yyyy h:mm a")}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
