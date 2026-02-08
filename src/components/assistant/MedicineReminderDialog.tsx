import { useState } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Clock,
  Bell,
  Volume2,
  Vibrate,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMedicineReminders } from "@/hooks/use-medicine-reminders";
import { toast } from "sonner";

interface MedicineReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReminderCreated: (message: string) => void;
  prefillData?: {
    medicineName?: string;
    dosage?: string;
    times?: string[];
    frequency?: string;
  };
}

const frequencyOptions = [
  { value: "daily", label: "Once Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "thrice_daily", label: "Three Times Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As Needed" },
];

const soundOptions = [
  { value: "default", label: "Default Alarm" },
  { value: "gentle", label: "Gentle Chime" },
  { value: "urgent", label: "Urgent Alert" },
];

const defaultTimes: Record<string, string[]> = {
  daily: ["09:00"],
  twice_daily: ["08:00", "20:00"],
  thrice_daily: ["08:00", "14:00", "20:00"],
  weekly: ["09:00"],
  as_needed: [],
};

const MedicineReminderDialog = ({
  isOpen,
  onClose,
  onReminderCreated,
  prefillData,
}: MedicineReminderDialogProps) => {
  const { createReminder } = useMedicineReminders();
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    medicineName: prefillData?.medicineName || "",
    dosage: prefillData?.dosage || "",
    frequency: prefillData?.frequency || "daily",
    times: prefillData?.times || ["09:00"],
    instructions: "",
    alarmSound: "default",
    alarmVibrate: true,
    repeatUntilAcknowledged: true,
    snoozeMinutes: 5,
  });

  const handleFrequencyChange = (frequency: string) => {
    setFormData((prev) => ({
      ...prev,
      frequency,
      times: defaultTimes[frequency] || [],
    }));
  };

  const handleTimeChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.map((t, i) => (i === index ? value : t)),
    }));
  };

  const addTimeSlot = () => {
    setFormData((prev) => ({
      ...prev,
      times: [...prev.times, "12:00"],
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.medicineName.trim()) {
      toast.error("Please enter medicine name");
      return;
    }

    if (formData.times.length === 0 && formData.frequency !== "as_needed") {
      toast.error("Please add at least one reminder time");
      return;
    }

    setCreating(true);

    try {
      await createReminder({
        medicineName: formData.medicineName,
        dosage: formData.dosage,
        frequency: formData.frequency as any,
        timesOfDay: formData.times,
        instructions: formData.instructions,
      });

      const message = `I've set up a reminder for ${formData.medicineName}${formData.dosage ? ` (${formData.dosage})` : ""}. You'll get ${formData.repeatUntilAcknowledged ? "a repeating alarm" : "a notification"} at ${formData.times.join(", ")} ${frequencyOptions.find((f) => f.value === formData.frequency)?.label.toLowerCase()}.`;
      
      onReminderCreated(message);
      
      // Reset form
      setFormData({
        medicineName: "",
        dosage: "",
        frequency: "daily",
        times: ["09:00"],
        instructions: "",
        alarmSound: "default",
        alarmVibrate: true,
        repeatUntilAcknowledged: true,
        snoozeMinutes: 5,
      });
      
      onClose();
    } catch (error) {
      toast.error("Failed to create reminder");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Create Medicine Reminder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medicine Name */}
          <div>
            <Label htmlFor="medicine-name">Medicine Name *</Label>
            <Input
              id="medicine-name"
              value={formData.medicineName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, medicineName: e.target.value }))
              }
              placeholder="e.g., Metformin"
            />
          </div>

          {/* Dosage */}
          <div>
            <Label htmlFor="dosage">Dosage (optional)</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dosage: e.target.value }))
              }
              placeholder="e.g., 500mg"
            />
          </div>

          {/* Frequency */}
          <div>
            <Label>Frequency</Label>
            <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reminder Times */}
          {formData.frequency !== "as_needed" && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Reminder Times</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addTimeSlot}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  Add Time
                </Button>
              </div>
              <div className="space-y-2">
                {formData.times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.times.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimeSlot(index)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Instructions (optional)</Label>
            <Input
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, instructions: e.target.value }))
              }
              placeholder="e.g., Take with food, after meals"
            />
          </div>

          {/* Alarm Settings */}
          <div className="rounded-lg border border-border p-4">
            <p className="mb-3 flex items-center gap-2 font-medium">
              <Bell className="h-4 w-4 text-primary" />
              Alarm Settings
            </p>

            {/* Alarm Sound */}
            <div className="mb-3">
              <Label className="text-sm">Alarm Sound</Label>
              <Select
                value={formData.alarmSound}
                onValueChange={(v) => setFormData((prev) => ({ ...prev, alarmSound: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {soundOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <Volume2 className="h-3 w-3" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vibration */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="vibrate" className="cursor-pointer text-sm">
                  Vibration
                </Label>
              </div>
              <Switch
                id="vibrate"
                checked={formData.alarmVibrate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, alarmVibrate: checked }))
                }
              />
            </div>

            {/* Repeat Until Acknowledged */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="repeat" className="cursor-pointer text-sm">
                  Repeat until acknowledged
                </Label>
              </div>
              <Switch
                id="repeat"
                checked={formData.repeatUntilAcknowledged}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, repeatUntilAcknowledged: checked }))
                }
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button className="w-full gap-2" onClick={handleSubmit} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Reminder...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Create Alarm Reminder
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MedicineReminderDialog;
