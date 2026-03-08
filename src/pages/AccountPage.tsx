import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface Profile {
  display_name: string | null;
  email: string | null;
  age: number | null;
  address: string | null;
  phone: string | null;
  avatar_url: string | null;
  notification_journals: boolean;
  notification_reminders: boolean;
  notification_tips: boolean;
}

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, email, age, address, phone, avatar_url, notification_journals, notification_reminders, notification_tips")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        age: profile.age,
        address: profile.address,
        phone: profile.phone,
        notification_journals: profile.notification_journals,
        notification_reminders: profile.notification_reminders,
        notification_tips: profile.notification_tips,
      })
      .eq("user_id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Profile updated!");
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated!");
      setNewPassword("");
    }
  };

  if (!profile) return <div className="p-6 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
      <h1 className="font-display text-xl font-bold text-foreground">Account Settings</h1>

      {/* Profile Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">Profile</h2>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Display Name</Label>
            <Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} className="rounded-xl h-10 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={profile.email ?? ""} disabled className="rounded-xl h-10 mt-1 opacity-50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Age</Label>
              <Input type="number" value={profile.age ?? ""} onChange={(e) => setProfile({ ...profile, age: e.target.value ? parseInt(e.target.value) : null })} className="rounded-xl h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="rounded-xl h-10 mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Address</Label>
            <Input value={profile.address ?? ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="rounded-xl h-10 mt-1" />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-10">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </motion.div>

      {/* Notifications */}
      <div className="glass rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        {[
          { key: "notification_journals" as const, label: "Journal Reminders" },
          { key: "notification_reminders" as const, label: "Daily Check-ins" },
          { key: "notification_tips" as const, label: "Wellness Tips" },
        ].map((n) => (
          <div key={n.key} className="flex items-center justify-between">
            <Label className="text-sm">{n.label}</Label>
            <Switch
              checked={profile[n.key]}
              onCheckedChange={(checked) => setProfile({ ...profile, [n.key]: checked })}
            />
          </div>
        ))}
      </div>

      {/* Appearance */}
      <div className="glass rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Moon className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {document.documentElement.classList.contains("dark") ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <Label className="text-sm">Dark Mode</Label>
          </div>
          <Switch
            checked={document.documentElement.classList.contains("dark")}
            onCheckedChange={(checked) => {
              document.documentElement.classList.toggle("dark", checked);
              localStorage.setItem("theme", checked ? "dark" : "light");
              // Force re-render
              setNewPassword((p) => p);
            }}
          />
        </div>
      </div>

      {/* Security */}
      <div className="glass rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">Security</h2>
        </div>
        <div>
          <Label className="text-xs">New Password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="rounded-xl h-10 mt-1" />
        </div>
        <Button onClick={handlePasswordChange} variant="outline" className="w-full rounded-xl h-10">
          Change Password
        </Button>
      </div>

      {/* Sign Out */}
      <Button onClick={signOut} variant="outline" className="w-full rounded-xl h-10 text-destructive border-destructive/20">
        <LogOut className="w-4 h-4 mr-2" /> Sign Out
      </Button>
    </div>
  );
}
