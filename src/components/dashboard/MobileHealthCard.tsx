import { useState } from "react";
import { motion } from "framer-motion";
import {
  Footprints,
  Flame,
  Timer,
  TrendingUp,
  Play,
  Pause,
  RefreshCw,
  Loader2,
  Mountain,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMobileHealth } from "@/hooks/use-mobile-health";
import { format } from "date-fns";

const MobileHealthCard = () => {
  const {
    todayData,
    weekData,
    loading,
    isTracking,
    localSteps,
    permissionGranted,
    startTracking,
    stopTracking,
    updateManually,
    generateDemoData,
  } = useMobileHealth();

  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualSteps, setManualSteps] = useState("");
  const [manualCalories, setManualCalories] = useState("");

  const handleManualUpdate = () => {
    const steps = parseInt(manualSteps) || 0;
    const calories = parseInt(manualCalories) || Math.round(steps * 0.04);
    
    updateManually({
      steps,
      calories_burned: calories,
      distance_meters: Math.round(steps * 0.76),
      active_minutes: Math.round(steps / 100),
    });
    
    setIsManualOpen(false);
    setManualSteps("");
    setManualCalories("");
  };

  const currentSteps = isTracking ? localSteps : (todayData?.steps || 0);
  const stepGoal = 10000;
  const stepProgress = Math.min(100, (currentSteps / stepGoal) * 100);

  // Calculate weekly average
  const weeklyAvgSteps = weekData.length > 0
    ? Math.round(weekData.reduce((sum, d) => sum + (d.steps || 0), 0) / weekData.length)
    : 0;

  const metrics = [
    {
      icon: Footprints,
      label: "Steps",
      value: currentSteps.toLocaleString(),
      goal: stepGoal.toLocaleString(),
      progress: stepProgress,
      color: "text-primary",
    },
    {
      icon: Flame,
      label: "Calories",
      value: (todayData?.calories_burned || Math.round(currentSteps * 0.04)).toLocaleString(),
      unit: "kcal",
      color: "text-warning",
    },
    {
      icon: Mountain,
      label: "Distance",
      value: ((todayData?.distance_meters || Math.round(currentSteps * 0.76)) / 1000).toFixed(1),
      unit: "km",
      color: "text-success",
    },
    {
      icon: Timer,
      label: "Active",
      value: (todayData?.active_minutes || Math.round(currentSteps / 100)).toString(),
      unit: "min",
      color: "text-info",
    },
  ];

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Footprints className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground sm:text-lg">
              Activity Tracking
            </h2>
            <p className="text-xs text-muted-foreground">
              {isTracking ? "Tracking active" : "From your device"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {permissionGranted !== false && (
            <Button
              variant={isTracking ? "secondary" : "default"}
              size="sm"
              className="gap-1"
              onClick={isTracking ? stopTracking : startTracking}
            >
              {isTracking ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline">Track</span>
                </>
              )}
            </Button>
          )}
          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter Activity Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Steps</label>
                  <Input
                    type="number"
                    value={manualSteps}
                    onChange={(e) => setManualSteps(e.target.value)}
                    placeholder="e.g., 8000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Calories Burned (optional)</label>
                  <Input
                    type="number"
                    value={manualCalories}
                    onChange={(e) => setManualCalories(e.target.value)}
                    placeholder="Auto-calculated if empty"
                  />
                </div>
                <Button className="w-full" onClick={handleManualUpdate}>
                  Update Activity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Step Progress */}
      <div className="mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Today's Steps</p>
            <p className="text-3xl font-bold text-foreground">{currentSteps.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Goal</p>
            <p className="text-lg font-semibold text-primary">{stepGoal.toLocaleString()}</p>
          </div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stepProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full bg-primary"
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {stepProgress >= 100
            ? "🎉 Goal reached!"
            : `${Math.round(stepProgress)}% of daily goal`}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.slice(1).map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-xl border border-border bg-muted/30 p-3"
          >
            <div className="mb-1 flex items-center gap-2">
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
              <span className="text-xs text-muted-foreground">{metric.label}</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {metric.value}
              {metric.unit && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Weekly Average */}
      {weekData.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm text-muted-foreground">7-day average</span>
          </div>
          <span className="font-semibold text-foreground">
            {weeklyAvgSteps.toLocaleString()} steps
          </span>
        </div>
      )}

      {/* Demo Data Button - for testing */}
      {weekData.length === 0 && !todayData && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4 w-full gap-2"
          onClick={generateDemoData}
        >
          <RefreshCw className="h-4 w-4" />
          Generate Demo Data
        </Button>
      )}
    </div>
  );
};

export default MobileHealthCard;
