import { useState } from "react";
import { motion } from "framer-motion";
import {
  Pill,
  Plus,
  Clock,
  Check,
  X,
  Bell,
  BellOff,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMedicineReminders } from "@/hooks/use-medicine-reminders";
import { format } from "date-fns";

const frequencyOptions = [
  { value: "daily", label: "Once Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "thrice_daily", label: "Three Times Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As Needed" },
];

const defaultTimes: Record<string, string[]> = {
  daily: ["09:00"],
  twice_daily: ["08:00", "20:00"],
  thrice_daily: ["08:00", "14:00", "20:00"],
  weekly: ["09:00"],
  as_needed: [],
};

const MedicineReminders = () => {
  const {
    reminders,
    todayLogs,
    loading,
    createReminder,
    markAsTaken,
    skipReminder,
    deleteReminder,
    toggleReminder,
    getUpcomingReminders,
  } = useMedicineReminders();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "daily",
    times: ["09:00"],
    instructions: "",
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

  const handleSubmit = async () => {
    if (!formData.medicineName.trim()) return;

    await createReminder({
      medicineName: formData.medicineName,
      dosage: formData.dosage,
      frequency: formData.frequency as any,
      timesOfDay: formData.times,
      instructions: formData.instructions,
    });

    setFormData({
      medicineName: "",
      dosage: "",
      frequency: "daily",
      times: ["09:00"],
      instructions: "",
    });
    setIsAddOpen(false);
  };

  const upcomingReminders = getUpcomingReminders();

  const getReminderStatus = (reminderId: string, time: string) => {
    const log = todayLogs.find(
      (l) => l.reminder_id === reminderId && l.scheduled_time.includes(time)
    );
    return log?.status || "pending";
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
            <Pill className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground sm:text-lg">
            Medicine Reminders
          </h2>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Medicine Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="medicine-name">Medicine Name</Label>
                <Input
                  id="medicine-name"
                  value={formData.medicineName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, medicineName: e.target.value }))
                  }
                  placeholder="e.g., Metformin"
                />
              </div>

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

              {formData.times.length > 0 && (
                <div>
                  <Label>Reminder Times</Label>
                  <div className="mt-2 space-y-2">
                    {formData.times.map((time, index) => (
                      <Input
                        key={index}
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="instructions">Instructions (optional)</Label>
                <Input
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                  }
                  placeholder="e.g., Take with food"
                />
              </div>

              <Button className="w-full" onClick={handleSubmit}>
                Create Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Schedule */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Pill className="mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No medicine reminders</p>
          <p className="text-xs text-muted-foreground">
            Add your medications to get timely reminders
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upcoming Today */}
          {upcomingReminders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">TODAY</p>
              <div className="space-y-2">
                {upcomingReminders.slice(0, 5).map(({ reminder, time, isTaken }, index) => (
                  <motion.div
                    key={`${reminder.id}-${time}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      isTaken
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isTaken ? "bg-success/20 text-success" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isTaken ? <Check className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{reminder.medicine_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{time}</span>
                        {reminder.dosage && <span>• {reminder.dosage}</span>}
                      </div>
                    </div>
                    {!isTaken && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-success hover:bg-success/10 hover:text-success"
                          onClick={() => markAsTaken(reminder.id)}
                        >
                          <Check className="h-3 w-3" />
                          Taken
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            skipReminder(
                              reminder.id,
                              new Date().toISOString().split("T")[0] + "T" + time
                            )
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Reminders */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">ALL REMINDERS</p>
            <div className="space-y-2">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{reminder.medicine_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reminder.times_of_day.join(", ")} •{" "}
                      {frequencyOptions.find((f) => f.value === reminder.frequency)?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineReminders;
