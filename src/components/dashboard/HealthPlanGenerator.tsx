import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Utensils,
  Activity,
  Moon,
  Pill,
  Download,
  Loader2,
  Check,
  ChevronRight,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useHealthPlans } from "@/hooks/use-health-plans";
import { format } from "date-fns";
import jsPDF from "jspdf";

const planTypes = [
  { value: "wellness", label: "General Wellness", description: "Balanced lifestyle improvement" },
  { value: "weight_loss", label: "Weight Management", description: "Healthy weight loss focus" },
  { value: "fitness", label: "Fitness & Strength", description: "Build fitness and endurance" },
  { value: "recovery", label: "Recovery & Healing", description: "Post-illness or surgery recovery" },
  { value: "custom", label: "Custom Plan", description: "Tailored to specific needs" },
];

const focusAreas = [
  { id: "diet", label: "Diet & Nutrition", icon: Utensils },
  { id: "exercise", label: "Physical Activity", icon: Activity },
  { id: "sleep", label: "Sleep & Rest", icon: Moon },
  { id: "medication", label: "Medication Schedule", icon: Pill },
  { id: "stress", label: "Stress Management", icon: Target },
];

const HealthPlanGenerator = () => {
  const { plans, activePlan, loading, generating, generatePlan, updatePlanStatus, deletePlan } =
    useHealthPlans();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isPlanViewOpen, setIsPlanViewOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    planType: "wellness",
    duration: 7 as 7 | 14 | 30,
    focusAreas: ["diet", "exercise", "sleep"],
  });

  const handleFocusToggle = (areaId: string) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((a) => a !== areaId)
        : [...prev.focusAreas, areaId],
    }));
  };

  const handleGenerate = async () => {
    const plan = await generatePlan({
      planType: formData.planType as any,
      duration: formData.duration,
      focusAreas: formData.focusAreas,
    });
    if (plan) {
      setIsGenerateOpen(false);
    }
  };

  const handleDownloadPDF = async (plan: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(plan.plan_name, pageWidth / 2, y, { align: "center" });
    y += 15;
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${plan.duration_days} Day Health Plan • ${format(new Date(plan.start_date), "MMM d")} - ${format(new Date(plan.end_date), "MMM d, yyyy")}`,
      pageWidth / 2, y, { align: "center" }
    );
    y += 20;
    
    // AI Recommendations
    if (plan.ai_recommendations) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("AI Recommendations", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const recLines = doc.splitTextToSize(plan.ai_recommendations, pageWidth - 40);
      doc.text(recLines, 20, y);
      y += recLines.length * 5 + 10;
    }
    
    // Diet Plan
    if (plan.diet_plan) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🍽️ Diet Plan", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (plan.diet_plan.overview) {
        const dietLines = doc.splitTextToSize(plan.diet_plan.overview, pageWidth - 40);
        doc.text(dietLines, 20, y);
        y += dietLines.length * 5 + 5;
      }
      if (plan.diet_plan.dailyCalorieTarget) {
        doc.text(`Daily Calorie Target: ${plan.diet_plan.dailyCalorieTarget} kcal`, 20, y);
        y += 10;
      }
    }
    
    // Activity Plan
    if (plan.activity_plan) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🏃 Activity Plan", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (plan.activity_plan.overview) {
        const activityLines = doc.splitTextToSize(plan.activity_plan.overview, pageWidth - 40);
        doc.text(activityLines, 20, y);
        y += activityLines.length * 5 + 5;
      }
      if (plan.activity_plan.weeklyTarget) {
        doc.text(`Weekly Target: ${plan.activity_plan.weeklyTarget}`, 20, y);
        y += 10;
      }
    }
    
    // Sleep Plan
    if (plan.sleep_plan) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🌙 Sleep Plan", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Target Hours: ${plan.sleep_plan.targetHours || 8} hours`, 20, y);
      y += 5;
      doc.text(`Bedtime: ${plan.sleep_plan.bedtime || "22:30"}`, 20, y);
      y += 5;
      doc.text(`Wake Time: ${plan.sleep_plan.wakeTime || "06:30"}`, 20, y);
      y += 10;
    }
    
    // Medicine Schedule
    if (plan.medicine_schedule?.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("💊 Medicine Schedule", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      plan.medicine_schedule.forEach((med: any) => {
        doc.text(`• ${med.name} (${med.dosage}): ${med.times?.join(", ") || "As prescribed"}`, 20, y);
        y += 5;
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by HealthAI - Your Personal Health Assistant", pageWidth / 2, 285, { align: "center" });
    
    doc.save(`${plan.plan_name.replace(/\s+/g, "_")}.pdf`);
  };
  const viewPlanDetails = (plan: any) => {
    setSelectedPlan(plan);
    setIsPlanViewOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Health Plans
          </h2>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generate Health Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Plan Type</label>
                <Select
                  value={formData.planType}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, planType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <span className="font-medium">{type.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {type.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Duration</label>
                <div className="flex gap-2">
                  {[7, 14, 30].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant={formData.duration === days ? "default" : "outline"}
                      className="flex-1"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, duration: days as 7 | 14 | 30 }))
                      }
                    >
                      {days} Days
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Focus Areas</label>
                <div className="space-y-2">
                  {focusAreas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <Checkbox
                        id={area.id}
                        checked={formData.focusAreas.includes(area.id)}
                        onCheckedChange={() => handleFocusToggle(area.id)}
                      />
                      <area.icon className="h-4 w-4 text-primary" />
                      <label htmlFor={area.id} className="flex-1 cursor-pointer text-sm">
                        {area.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={generating || formData.focusAreas.length === 0}
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate AI Health Plan
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Plan */}
      {activePlan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              Active Plan
            </span>
            <span className="text-xs text-muted-foreground">
              Day {Math.ceil((Date.now() - new Date(activePlan.start_date).getTime()) / (1000 * 60 * 60 * 24))} of {activePlan.duration_days}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{activePlan.plan_name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {format(new Date(activePlan.start_date), "MMM d")} - {format(new Date(activePlan.end_date), "MMM d, yyyy")}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => viewPlanDetails(activePlan)}
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadPDF(activePlan)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Plan List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Calendar className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No health plans yet</p>
          <p className="text-xs text-muted-foreground">
            Generate a personalized plan based on your health data
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {plans
            .filter((p) => p.id !== activePlan?.id)
            .slice(0, 3)
            .map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{plan.plan_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {plan.duration_days} days •{" "}
                    <span
                      className={
                        plan.status === "completed"
                          ? "text-success"
                          : plan.status === "paused"
                          ? "text-warning"
                          : ""
                      }
                    >
                      {plan.status}
                    </span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => viewPlanDetails(plan)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
        </div>
      )}

      {/* Plan Details Dialog */}
      <Dialog open={isPlanViewOpen} onOpenChange={setIsPlanViewOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPlan?.plan_name}</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{selectedPlan.duration_days} days</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{selectedPlan.status}</span>
              </div>

              {selectedPlan.ai_recommendations && (
                <div>
                  <h4 className="mb-1 font-medium">AI Recommendations</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.ai_recommendations}
                  </p>
                </div>
              )}

              {selectedPlan.diet_plan && (
                <div>
                  <h4 className="mb-1 flex items-center gap-2 font-medium">
                    <Utensils className="h-4 w-4 text-primary" />
                    Diet Plan
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.diet_plan.overview}
                  </p>
                </div>
              )}

              {selectedPlan.activity_plan && (
                <div>
                  <h4 className="mb-1 flex items-center gap-2 font-medium">
                    <Activity className="h-4 w-4 text-primary" />
                    Activity Plan
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.activity_plan.overview}
                  </p>
                </div>
              )}

              {selectedPlan.sleep_plan && (
                <div>
                  <h4 className="mb-1 flex items-center gap-2 font-medium">
                    <Moon className="h-4 w-4 text-primary" />
                    Sleep Plan
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Target: {selectedPlan.sleep_plan.targetHours}h • Bedtime:{" "}
                    {selectedPlan.sleep_plan.bedtime}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleDownloadPDF(selectedPlan)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                {selectedPlan.status !== "active" && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      updatePlanStatus(selectedPlan.id, "active");
                      setIsPlanViewOpen(false);
                    }}
                  >
                    Activate Plan
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HealthPlanGenerator;
