import { motion } from "framer-motion";
import {
  Smartphone,
  Focus,
  Moon,
  Brain,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDigitalWellness } from "@/hooks/use-digital-wellness";

// Professional labels for behavioral metrics
// Avoid harsh terms like "addiction" - use wellness-focused language
const DigitalWellnessCard = () => {
  const { derivedMetrics, loading, generateDemoMetrics } = useDigitalWellness();

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const metrics = derivedMetrics;

  const getTrendIcon = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up":
        return <TrendingUp className="h-3 w-3" />;
      case "down":
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getStressColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-warning bg-warning/10";
      case "medium":
        return "text-primary bg-primary/10";
      default:
        return "text-success bg-success/10";
    }
  };

  const getFocusColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-warning bg-warning/10";
      case "moderate":
        return "text-primary bg-primary/10";
      default:
        return "text-success bg-success/10";
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Digital Wellness
          </h2>
        </div>
        {!metrics?.screenTime.minutes && (
          <Button
            variant="outline"
            size="sm"
            onClick={generateDemoMetrics}
            className="text-xs"
          >
            Sync Data
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Screen Time */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            {metrics && metrics.screenTime.trend.percentage > 0 && (
              <span
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${
                  metrics.screenTime.trend.direction === "up"
                    ? "bg-warning/10 text-warning"
                    : metrics.screenTime.trend.direction === "down"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {getTrendIcon(metrics.screenTime.trend.direction)}
                {metrics.screenTime.trend.percentage}%
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Screen Time</p>
          <p className="text-sm font-bold text-foreground sm:text-lg">
            {metrics ? formatMinutes(metrics.screenTime.minutes) : "--"}
          </p>
        </div>

        {/* Focus Stability */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
                metrics ? getFocusColor(metrics.focusStability.level) : "bg-muted"
              }`}
            >
              <Focus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Focus Balance</p>
          <p className="text-sm font-bold capitalize text-foreground sm:text-lg">
            {metrics?.focusStability.level || "--"}
          </p>
        </div>

        {/* Sleep Consistency */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
                metrics?.sleepConsistency.level === "consistent"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Sleep Pattern</p>
          <p className="text-sm font-bold capitalize text-foreground sm:text-lg">
            {metrics?.sleepConsistency.level || "--"}
          </p>
        </div>

        {/* Stress Level */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg sm:h-8 sm:w-8 ${
                metrics ? getStressColor(metrics.stressLevel.level) : "bg-muted"
              }`}
            >
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            {metrics && metrics.stressLevel.trend.percentage > 0 && (
              <span
                className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${
                  metrics.stressLevel.trend.direction === "up"
                    ? "bg-warning/10 text-warning"
                    : metrics.stressLevel.trend.direction === "down"
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {getTrendIcon(metrics.stressLevel.trend.direction)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground sm:text-xs">Recovery Need</p>
          <p className="text-sm font-bold capitalize text-foreground sm:text-lg">
            {metrics?.stressLevel.level || "--"}
          </p>
        </div>
      </div>

      {/* Late Night Activity Insight */}
      {metrics && metrics.lateNightActivity.minutes > 0 && (
        <div className="mt-3 rounded-lg bg-primary/5 p-3 sm:mt-4">
          <p className="text-xs text-muted-foreground sm:text-sm">
            <span className="font-medium text-foreground">
              {formatMinutes(metrics.lateNightActivity.minutes)}
            </span>{" "}
            of evening activity after 11 PM
          </p>
          <p className="mt-1 text-[10px] text-primary sm:text-xs">
            {metrics.lateNightActivity.healthImpact}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DigitalWellnessCard;
