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
  Sparkles,
  Check,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHealthPlans } from "@/hooks/use-health-plans";
import jsPDF from "jspdf";
import { format } from "date-fns";

interface HealthPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (summary: string) => void;
}

const planTypes = [
  { value: "ai_recommended", label: "AI Recommended", description: "Based on your health data" },
  { value: "custom", label: "Custom Plan", description: "Specify your preferences" },
];

const dietPreferences = [
  { id: "diabetic_friendly", label: "Diabetic Friendly" },
  { id: "weight_loss", label: "Weight Loss" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "low_carb", label: "Low Carb" },
  { id: "high_protein", label: "High Protein" },
  { id: "heart_healthy", label: "Heart Healthy" },
  { id: "gluten_free", label: "Gluten Free" },
];

const focusAreas = [
  { id: "diet", label: "Diet & Nutrition", icon: Utensils },
  { id: "exercise", label: "Physical Activity", icon: Activity },
  { id: "sleep", label: "Sleep & Rest", icon: Moon },
  { id: "medication", label: "Medication Schedule", icon: Pill },
  { id: "stress", label: "Stress Management", icon: Target },
];

const HealthPlanDialog = ({ isOpen, onClose, onPlanGenerated }: HealthPlanDialogProps) => {
  const { generating, generatePlan } = useHealthPlans();
  
  const [planMode, setPlanMode] = useState<"ai_recommended" | "custom">("ai_recommended");
  const [duration, setDuration] = useState<7 | 14 | 30>(7);
  const [selectedDietPrefs, setSelectedDietPrefs] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(["diet", "exercise", "sleep"]);
  const [customInstructions, setCustomInstructions] = useState("");

  const handleDietPrefToggle = (prefId: string) => {
    setSelectedDietPrefs((prev) =>
      prev.includes(prefId)
        ? prev.filter((p) => p !== prefId)
        : [...prev, prefId]
    );
  };

  const handleFocusToggle = (areaId: string) => {
    setSelectedFocusAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((a) => a !== areaId)
        : [...prev, areaId]
    );
  };

  const handleGenerate = async () => {
    const plan = await generatePlan({
      planType: planMode === "ai_recommended" ? "wellness" : "custom",
      duration,
      focusAreas: selectedFocusAreas,
      dietPreferences: planMode === "custom" ? selectedDietPrefs : undefined,
      customInstructions: planMode === "custom" ? customInstructions : undefined,
    });

    if (plan) {
      const summary = `I've created your ${duration}-day ${planMode === "ai_recommended" ? "AI-recommended" : "custom"} health plan! It includes ${selectedFocusAreas.map((a) => focusAreas.find((f) => f.id === a)?.label).join(", ")}. ${plan.ai_recommendations || ""}`;
      onPlanGenerated(summary);
      onClose();
    }
  };

  const downloadPlanAsPDF = async (plan: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(59, 130, 246);
    doc.text(plan.plan_name, pageWidth / 2, y, { align: "center" });
    y += 12;

    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `${plan.duration_days}-Day Health Plan | ${format(new Date(plan.start_date), "MMM d")} - ${format(new Date(plan.end_date), "MMM d, yyyy")}`,
      pageWidth / 2, y, { align: "center" }
    );
    y += 20;

    // AI Recommendations
    if (plan.ai_recommendations) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Overview", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const recLines = doc.splitTextToSize(plan.ai_recommendations, pageWidth - 40);
      doc.text(recLines, 20, y);
      y += recLines.length * 5 + 12;
    }

    // Diet Plan Section
    if (plan.diet_plan) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(15, y - 5, pageWidth - 30, 8, 2, 2, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text("🍽️ Diet & Nutrition", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      if (plan.diet_plan.overview) {
        const dietLines = doc.splitTextToSize(plan.diet_plan.overview, pageWidth - 40);
        doc.text(dietLines, 20, y);
        y += dietLines.length * 5 + 5;
      }
      if (plan.diet_plan.dailyCalorieTarget) {
        doc.text(`Daily Calorie Target: ${plan.diet_plan.dailyCalorieTarget} kcal`, 20, y);
        y += 12;
      }
    }

    // Activity Plan Section
    if (plan.activity_plan) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(15, y - 5, pageWidth - 30, 8, 2, 2, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text("🏃 Physical Activity", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      if (plan.activity_plan.overview) {
        const activityLines = doc.splitTextToSize(plan.activity_plan.overview, pageWidth - 40);
        doc.text(activityLines, 20, y);
        y += activityLines.length * 5 + 5;
      }
      if (plan.activity_plan.weeklyTarget) {
        doc.text(`Weekly Target: ${plan.activity_plan.weeklyTarget}`, 20, y);
        y += 12;
      }
    }

    // Sleep Plan Section
    if (plan.sleep_plan) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 243, 255);
      doc.roundedRect(15, y - 5, pageWidth - 30, 8, 2, 2, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(139, 92, 246);
      doc.text("🌙 Sleep & Rest", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(`Target: ${plan.sleep_plan.targetHours || 8} hours/night`, 20, y);
      y += 5;
      doc.text(`Bedtime: ${plan.sleep_plan.bedtime || "22:30"} | Wake: ${plan.sleep_plan.wakeTime || "06:30"}`, 20, y);
      y += 12;
    }

    // Medicine Schedule
    if (plan.medicine_schedule?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(15, y - 5, pageWidth - 30, 8, 2, 2, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text("💊 Medication Schedule", 20, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      plan.medicine_schedule.forEach((med: any) => {
        doc.text(`• ${med.name} (${med.dosage}): ${med.times?.join(", ") || "As prescribed"}`, 20, y);
        y += 6;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by HealthAI - Your Personal Health Assistant", pageWidth / 2, 285, { align: "center" });

    doc.save(`Health_Plan_${duration}days.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Generate Health Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Plan Mode Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium">Plan Type</label>
            <div className="grid grid-cols-2 gap-2">
              {planTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setPlanMode(type.value as "ai_recommended" | "custom")}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    planMode === type.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="mb-2 block text-sm font-medium">Duration</label>
            <div className="flex gap-2">
              {([7, 14, 30] as const).map((days) => (
                <Button
                  key={days}
                  type="button"
                  variant={duration === days ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setDuration(days)}
                >
                  {days} Days
                </Button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
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
                    checked={selectedFocusAreas.includes(area.id)}
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

          {/* Custom Options (only for custom mode) */}
          {planMode === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Diet Preferences */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Diet Preferences (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {dietPreferences.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => handleDietPrefToggle(pref.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedDietPrefs.includes(pref.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {pref.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Additional Instructions (optional)
                </label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="E.g., I have knee pain so avoid high-impact exercises, I prefer home workouts..."
                  rows={3}
                />
              </div>
            </motion.div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating || selectedFocusAreas.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Your Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate {duration}-Day Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HealthPlanDialog;
