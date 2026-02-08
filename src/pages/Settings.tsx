import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MobileNav } from "@/components/layout/MobileNav";
import { Label } from "@/components/ui/label";
import {
  Activity,
  ArrowLeft,
  Moon,
  Bell,
  MapPin,
  Camera,
  Mic,
  Smartphone,
  LogOut,
  Shield,
  Trash2,
  ChevronRight,
  Sun,
  Watch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { useHealthData } from "@/hooks/use-health-data";
import DeleteAccountDialog from "@/components/dashboard/DeleteAccountDialog";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { devices } = useHealthData();

  const [settings, setSettings] = useState({
    notifications: true,
    locationAccess: true,
    cameraAccess: false,
    microphoneAccess: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast({
      title: "Setting updated",
      description: `${key.replace(/([A-Z])/g, " $1").trim()} has been ${value ? "enabled" : "disabled"}.`,
    });
  };

  const handleDarkModeToggle = () => {
    toggleTheme();
    toast({
      title: "Theme changed",
      description: `Switched to ${theme === "light" ? "dark" : "light"} mode.`,
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  const connectedWatches = devices.filter((d) => d.status === "connected").length;
  const totalWatches = devices.length;

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Settings</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Account</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/profile">
                  Edit Profile
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="text-base font-medium">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
          </motion.div>

          {/* Permissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Permissions</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="notifications" className="text-base font-medium">Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive health alerts and reminders</p>
                  </div>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting("notifications", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="location" className="text-base font-medium">Location Access</Label>
                    <p className="text-sm text-muted-foreground">For nearby health services</p>
                  </div>
                </div>
                <Switch
                  id="location"
                  checked={settings.locationAccess}
                  onCheckedChange={(checked) => updateSetting("locationAccess", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Camera className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="camera" className="text-base font-medium">Camera Access</Label>
                    <p className="text-sm text-muted-foreground">For scanning documents and QR codes</p>
                  </div>
                </div>
                <Switch
                  id="camera"
                  checked={settings.cameraAccess}
                  onCheckedChange={(checked) => updateSetting("cameraAccess", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Mic className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <Label htmlFor="microphone" className="text-base font-medium">Microphone Access</Label>
                    <p className="text-sm text-muted-foreground">For voice commands with AI assistant</p>
                  </div>
                </div>
                <Switch
                  id="microphone"
                  checked={settings.microphoneAccess}
                  onCheckedChange={(checked) => updateSetting("microphoneAccess", checked)}
                />
              </div>
            </div>
          </motion.div>

          {/* Connected Watches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Watch className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Connected Watches</h2>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/watch-connect">
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            {totalWatches > 0 ? (
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{connectedWatches} Connected</p>
                    <p className="text-sm text-muted-foreground">{totalWatches} total device(s)</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    connectedWatches > 0 ? "bg-success/20" : "bg-muted"
                  }`}>
                    <Watch className={`h-5 w-5 ${connectedWatches > 0 ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">No watches connected yet</p>
                <Button variant="link" size="sm" className="mt-1" asChild>
                  <Link to="/watch-connect">Connect your first watch</Link>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <Button
              variant="outline"
              className="w-full justify-start text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <DeleteAccountDialog />
          </motion.div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default Settings;
