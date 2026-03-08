import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingProps {
  onComplete: () => void;
}

const moodOptions = [
  { label: "Great", emoji: "😊", value: 5 },
  { label: "Good", emoji: "🙂", value: 4 },
  { label: "Okay", emoji: "😐", value: 3 },
  { label: "Not great", emoji: "😔", value: 2 },
  { label: "Bad", emoji: "😢", value: 1 },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {step === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Welcome!</h1>
            <p className="text-muted-foreground mb-8">Let's start by checking in on how you're feeling today.</p>
            <Button onClick={() => setStep(1)} className="rounded-xl px-8 h-11">
              Let's Begin <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">How are you feeling?</h2>
            <p className="text-muted-foreground mb-8 text-sm">Select the mood that best describes your day</p>
            <div className="space-y-3 mb-8">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    selectedMood === mood.value
                      ? "border-foreground bg-secondary shadow-soft"
                      : "border-border bg-card hover:border-foreground/20"
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium text-foreground">{mood.label}</span>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < mood.value ? "text-foreground fill-foreground" : "text-border"}`}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <Button
              onClick={onComplete}
              disabled={!selectedMood}
              className="rounded-xl px-8 h-11 w-full"
            >
              Continue to App
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
