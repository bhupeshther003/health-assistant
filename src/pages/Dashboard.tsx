import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Heart,
  Footprints,
  Flame,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  MapPin,
  ChevronRight,
  Watch,
  Brain,
  Smartphone,
  RefreshCw,
   Pill,
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { useAuth } from "@/hooks/use-auth";
import { useHealthData } from "@/hooks/use-health-data";
import { useMobileHealth } from "@/hooks/use-mobile-health";
import DigitalWellnessCard from "@/components/dashboard/DigitalWellnessCard";
 import GlobalAlarmOverlay from "@/components/dashboard/GlobalAlarmOverlay";
 import MedicineRemindersCard from "@/components/dashboard/MedicineRemindersCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { location, startTracking } = useGeoLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { latestMetric, alerts, devices, loading: healthLoading } = useHealthData();
   const { todayData, weekData, loading: mobileLoading, isTracking, localSteps, startTracking: startMobileTracking, stopTracking, generateDemoData, syncData, error: mobileError } = useMobileHealth();
  const [healthScore, setHealthScore] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    startTracking();
  }, []);

  // Calculate health score based on metrics
  useEffect(() => {
    if (latestMetric) {
      let score = 70;
      if (latestMetric.heart_rate && latestMetric.heart_rate >= 60 && latestMetric.heart_rate <= 100) score += 10;
      else if (latestMetric.heart_rate && latestMetric.heart_rate >= 50 && latestMetric.heart_rate <= 110) score += 5;
      
      if (latestMetric.blood_pressure_systolic && latestMetric.blood_pressure_diastolic) {
        if (latestMetric.blood_pressure_systolic <= 120 && latestMetric.blood_pressure_diastolic <= 80) score += 10;
        else if (latestMetric.blood_pressure_systolic <= 140 && latestMetric.blood_pressure_diastolic <= 90) score += 5;
      }
      
      if (latestMetric.blood_sugar) {
        if (latestMetric.blood_sugar >= 70 && latestMetric.blood_sugar <= 100) score += 10;
        else if (latestMetric.blood_sugar >= 60 && latestMetric.blood_sugar <= 140) score += 5;
      }
      
      setHealthScore(Math.min(100, score));
    } else {
      setHealthScore(profile?.health_score || 75);
    }
  }, [latestMetric, profile]);

  const handleFindClinic = () => {
    navigate("/assistant", { state: { initialPrompt: "Find nearby clinic for my health needs" } });
  };

  const handleSyncData = async () => {
    setSyncing(true);
     await syncData();
     setSyncing(false);
  };

  // Get current steps (from tracking or today's saved data)
  const currentSteps = isTracking ? localSteps : (todayData?.steps || 0);
  const currentCalories = todayData?.calories_burned || Math.round(currentSteps * 0.04);
  const currentDistance = todayData?.distance_meters || Math.round(currentSteps * 0.76);
  const activeMinutes = todayData?.active_minutes || Math.round(currentSteps / 100);

  // Calculate weekly average
  const weeklyAvgSteps = weekData.length > 0
    ? Math.round(weekData.reduce((sum, d) => sum + (d.steps || 0), 0) / weekData.length)
    : 0;

  // Primary health metrics from mobile
  const primaryMetrics = [
    {
      icon: Footprints,
      label: "Steps Today",
      value: currentSteps.toLocaleString(),
      unit: "",
      goal: "10,000",
      progress: Math.min(100, (currentSteps / 10000) * 100),
      status: currentSteps >= 5000 ? "good" : "normal",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Flame,
      label: "Calories Today",
      value: currentCalories.toLocaleString(),
      unit: "kcal",
      goal: "400",
      progress: Math.min(100, (currentCalories / 400) * 100),
      status: currentCalories >= 200 ? "good" : "normal",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  // Secondary metrics
  const secondaryMetrics = [
    {
      icon: TrendingUp,
      label: "Distance",
      value: (currentDistance / 1000).toFixed(1),
      unit: "km",
      color: "text-green-500",
    },
    {
      icon: Activity,
      label: "Active Time",
      value: activeMinutes.toString(),
      unit: "min",
      color: "text-blue-500",
    },
    {
      icon: Heart,
      label: "Avg Steps (7d)",
      value: weeklyAvgSteps.toLocaleString(),
      unit: "",
      color: "text-purple-500",
    },
  ];

  // AI insights from alerts and data patterns
  const aiInsights = [
    ...(alerts.filter(a => !a.is_read).slice(0, 2).map(alert => ({
      type: "alert" as const,
      icon: AlertCircle,
      title: alert.title,
      message: alert.message || "Check your health metrics",
    }))),
    {
      type: "tip" as const,
      icon: Lightbulb,
      title: currentSteps < 3000 ? "Get Moving!" : "Great Progress!",
      message: currentSteps < 3000 
        ? "You're behind on steps today. A 15-minute walk can help!"
        : `You've walked ${currentSteps.toLocaleString()} steps. Keep it up!`,
    },
    {
      type: "insight" as const,
      icon: Smartphone,
      title: "Mobile Tracking",
      message: isTracking 
        ? "Live step tracking is active. Your activity is being monitored."
        : "Tap 'Start Tracking' to monitor your steps in real-time.",
    },
  ].slice(0, 3);

  const firstName = profile?.first_name || "there";

  if (!user && !authLoading) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Sidebar />
      
       {/* Global Alarm Overlay - visible on any screen */}
       <GlobalAlarmOverlay />

      {/* Main Content */}
      <main className="lg:ml-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-sm sm:h-16 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:h-9 sm:w-9">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <span className="text-base font-bold text-foreground sm:text-lg">HealthAI</span>
          </div>
          {location && location.city && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              {location.city}
            </div>
          )}
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="mb-1 text-xl font-bold text-foreground sm:mb-2 sm:text-2xl lg:text-3xl">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Here's your activity overview for today
              {location?.city && ` • ${location.city}, ${location.state}`}
            </p>
          </motion.div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left Column - Primary Metrics */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              
              {/* Primary Metrics - Steps & Calories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">
                    Today's Activity
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleSyncData}
                      disabled={syncing}
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Sync</span>
                    </Button>
                    <Button
                      variant={isTracking ? "secondary" : "default"}
                      size="sm"
                      onClick={isTracking ? stopTracking : startMobileTracking}
                    >
                      {isTracking ? "Stop" : "Start"} Tracking
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {primaryMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6"
                    >
                      <div className="mb-3 flex items-center justify-between sm:mb-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${metric.bgColor}`}>
                          <metric.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${metric.color}`} />
                        </div>
                        {metric.progress >= 50 && (
                          <span className="rounded-full bg-success/10 px-2 py-1 text-xs font-medium text-success">
                            {Math.round(metric.progress)}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground sm:text-sm">{metric.label}</p>
                      <p className="text-2xl font-bold text-foreground sm:text-3xl">
                        {metric.value}
                        {metric.unit && (
                          <span className="ml-1 text-sm font-normal text-muted-foreground">
                            {metric.unit}
                          </span>
                        )}
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.progress}%` }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                          className={`h-full rounded-full ${metric.color.replace("text-", "bg-")}`}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Goal: {metric.goal} {metric.unit}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Secondary Metrics Row */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {secondaryMetrics.map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      className="rounded-xl border border-border bg-card p-3 text-center"
                    >
                      <metric.icon className={`mx-auto mb-1 h-5 w-5 ${metric.color}`} />
                      <p className="text-lg font-bold text-foreground">
                        {metric.value}
                        {metric.unit && (
                          <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                            {metric.unit}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* AI Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <h2 className="text-base font-semibold text-foreground sm:text-lg">AI Insights</h2>
                  <Button variant="ghost" size="sm" asChild className="h-8 text-xs sm:h-9 sm:text-sm">
                    <Link to="/assistant">
                      View All
                      <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {aiInsights.map((insight, index) => (
                    <motion.div
                      key={insight.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className={`flex gap-3 rounded-xl border p-3 sm:gap-4 sm:p-4 ${
                        insight.type === "alert"
                          ? "border-warning/30 bg-warning/5"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${
                        insight.type === "alert"
                          ? "bg-warning/20 text-warning"
                          : insight.type === "tip"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/10 text-success"
                      }`}>
                        <insight.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-medium text-foreground sm:text-base">{insight.title}</h3>
                        <p className="text-xs text-muted-foreground sm:text-sm">{insight.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Digital Wellness */}
              <DigitalWellnessCard />
               
               {/* Medicine Reminders */}
               <MedicineRemindersCard compact />
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Health Score */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl p-4 text-primary-foreground gradient-hero sm:rounded-2xl sm:p-6"
              >
                <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20 sm:h-12 sm:w-12 sm:rounded-xl">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/80 sm:text-sm">Health Score</p>
                    <p className="text-xl font-bold sm:text-2xl">{healthScore}/100</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary-foreground/20 sm:h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary-foreground"
                  />
                </div>
                <p className="mt-2 text-xs text-primary-foreground/80 sm:mt-3 sm:text-sm">
                  {healthScore >= 80 ? "Great! Keep up the healthy habits." : 
                   healthScore >= 60 ? "Good progress! There's room for improvement." :
                   "Let's work on improving your health metrics."}
                </p>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6"
              >
                <h2 className="mb-3 text-base font-semibold text-foreground sm:mb-4 sm:text-lg">Quick Actions</h2>
                <div className="space-y-2 sm:space-y-3">
                  <Button variant="secondary" className="h-10 w-full justify-start text-sm sm:h-auto sm:text-base" asChild>
                    <Link to="/assistant">
                      <Brain className="mr-2 h-4 w-4" />
                      Talk to AI Assistant
                    </Link>
                  </Button>
                   <Button 
                     variant="secondary" 
                     className="h-10 w-full justify-start text-sm sm:h-auto sm:text-base"
                     onClick={() => {
                       const section = document.getElementById("medicine-reminders-section");
                       section?.scrollIntoView({ behavior: "smooth" });
                     }}
                   >
                     <Pill className="mr-2 h-4 w-4" />
                     Medicine Reminders
                   </Button>
                  <Button 
                    variant="secondary" 
                    className="h-10 w-full justify-start text-sm sm:h-auto sm:text-base"
                    onClick={handleFindClinic}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Nearby Clinic
                  </Button>
                  <Button variant="secondary" className="h-10 w-full justify-start text-sm sm:h-auto sm:text-base" asChild>
                    <Link to="/watch-connect">
                      <Watch className="mr-2 h-4 w-4" />
                      {devices.length > 0 ? "Manage Watches" : "Connect Smart Watch"}
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Profile Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6"
              >
                <h2 className="mb-3 text-base font-semibold text-foreground sm:mb-4 sm:text-lg">Profile Summary</h2>
                <div className="space-y-2 text-xs sm:space-y-3 sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium text-foreground">
                      {profile?.first_name || profile?.last_name 
                        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activity Level</span>
                    <span className="font-medium text-foreground capitalize">
                      {profile?.activity_level || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground">
                      {location?.city 
                        ? `${location.city}, ${location.state?.slice(0, 2) || ""}` 
                        : profile?.location_city 
                          ? `${profile.location_city}, ${profile.location_state?.slice(0, 2) || ""}`
                          : "Not set"}
                    </span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 h-8 w-full text-xs sm:mt-4 sm:h-9 sm:text-sm" asChild>
                  <Link to="/profile">Edit Profile</Link>
                </Button>
              </motion.div>

              {/* Generate Demo Data (for testing) */}
              {weekData.length === 0 && !todayData && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={generateDemoData}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Demo Activity Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default Dashboard;
