import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Heart, BarChart3, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: MessageCircle, title: "AI Chatbot", desc: "Get personalized wellness advice based on your journals" },
  { icon: BarChart3, title: "Mood Tracking", desc: "Visualize your mental health trends over time" },
  { icon: Heart, title: "Journal Entries", desc: "Express your thoughts and receive AI-powered insights" },
  { icon: MapPin, title: "Wellness Map", desc: "Discover nearby parks, clinics, and wellness centers" },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-accent/30" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm mb-8">
              <Brain className="w-4 h-4" />
              Your mental health companion
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6">
              Wellness<br />
              <span className="text-muted-foreground">Journal</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Track your mood, journal your thoughts, and get AI-powered insights to support your mental health journey.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base shadow-card"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base"
                onClick={() => navigate("/auth?tab=login")}
              >
                Login
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass rounded-2xl p-6 shadow-soft"
            >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-1">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
