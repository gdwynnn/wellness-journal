import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, BarChart3, Plus, User, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import Onboarding from "@/components/Onboarding";

const navItems = [
  { icon: MessageCircle, label: "Chat", path: "/app/chat" },
  { icon: BarChart3, label: "Stats", path: "/app/stats" },
  { icon: Plus, label: "Journal", path: "/app/journal", isCenter: true },
  { icon: User, label: "Account", path: "/app/account" },
  { icon: MapPin, label: "Map", path: "/app/map" },
];

export default function AppShell() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?tab=login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          setIsOnboarded(data?.is_onboarded ?? false);
        });
    }
  }, [user]);

  const handleOnboardingComplete = async () => {
    if (user) {
      await supabase.from("profiles").update({ is_onboarded: true }).eq("user_id", user.id);
      setIsOnboarded(true);
    }
  };

  if (loading || isOnboarded === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50">
        <div className="max-w-lg mx-auto flex items-end justify-around px-2 pt-2 pb-safe">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            if (item.isCenter) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative -top-4 w-14 h-14 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-elevated transition-transform active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              );
            }
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-colors ${isActive ? "text-foreground" : "text-muted-foreground"}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
