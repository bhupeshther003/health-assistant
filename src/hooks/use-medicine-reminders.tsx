import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

interface MedicineReminder {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string;
  times_of_day: string[];
  days_of_week: number[];
  start_date: string;
  end_date: string | null;
  instructions: string | null;
  source_document_id: string | null;
  is_active: boolean;
  last_taken_at: string | null;
  created_at: string;
  updated_at: string;
}

interface MedicineLog {
  id: string;
  reminder_id: string;
  scheduled_time: string;
  taken_at: string | null;
  status: string;
  notes: string | null;
}

interface CreateReminderOptions {
  medicineName: string;
  dosage?: string;
  frequency: "daily" | "twice_daily" | "thrice_daily" | "weekly" | "as_needed";
  timesOfDay: string[];
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string;
  instructions?: string;
  sourceDocumentId?: string;
}

export function useMedicineReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [todayLogs, setTodayLogs] = useState<MedicineLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("medicine_reminders")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTodayLogs = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("medicine_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("scheduled_time", `${today}T00:00:00`)
        .lte("scheduled_time", `${today}T23:59:59`)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setTodayLogs(data || []);
    } catch (error) {
      console.error("Error fetching today's logs:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchReminders();
    fetchTodayLogs();
  }, [fetchReminders, fetchTodayLogs]);

  // Check for upcoming reminders and show notifications
  useEffect(() => {
    if (!reminders.length) return;

    const checkReminders = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

      reminders.forEach((reminder) => {
        reminder.times_of_day.forEach((time) => {
          // Check if it's time for this reminder (within 1 minute)
          if (time === currentTime) {
            // Check if browser notifications are supported and permitted
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("Medicine Reminder", {
                body: `Time to take ${reminder.medicine_name}${reminder.dosage ? ` - ${reminder.dosage}` : ""}`,
                icon: "/favicon.ico",
              });
            }
            toast.info(`Time to take ${reminder.medicine_name}`, {
              description: reminder.dosage || undefined,
              duration: 10000,
            });
          }
        });
      });
    };

    // Check every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const createReminder = async (options: CreateReminderOptions): Promise<MedicineReminder | null> => {
    if (!user) {
      toast.error("Please login to create reminders");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("medicine_reminders")
        .insert({
          user_id: user.id,
          medicine_name: options.medicineName,
          dosage: options.dosage,
          frequency: options.frequency,
          times_of_day: options.timesOfDay,
          days_of_week: options.daysOfWeek || [1, 2, 3, 4, 5, 6, 7],
          start_date: options.startDate || new Date().toISOString().split("T")[0],
          end_date: options.endDate,
          instructions: options.instructions,
          source_document_id: options.sourceDocumentId,
        })
        .select()
        .single();

      if (error) throw error;

      setReminders((prev) => [data, ...prev]);
      toast.success("Reminder created successfully");

      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }

      return data;
    } catch (error) {
      console.error("Error creating reminder:", error);
      toast.error("Failed to create reminder");
      return null;
    }
  };

  const markAsTaken = async (reminderId: string, scheduledTime?: string) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const scheduled = scheduledTime || now;

      // Create or update log
      const { error: logError } = await supabase
        .from("medicine_logs")
        .upsert({
          user_id: user.id,
          reminder_id: reminderId,
          scheduled_time: scheduled,
          taken_at: now,
          status: "taken",
        });

      if (logError) throw logError;

      // Update last_taken_at on reminder
      const { error: updateError } = await supabase
        .from("medicine_reminders")
        .update({ last_taken_at: now })
        .eq("id", reminderId);

      if (updateError) throw updateError;

      await fetchTodayLogs();
      toast.success("Marked as taken");
    } catch (error) {
      console.error("Error marking as taken:", error);
      toast.error("Failed to update");
    }
  };

  const skipReminder = async (reminderId: string, scheduledTime: string, reason?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("medicine_logs").upsert({
        user_id: user.id,
        reminder_id: reminderId,
        scheduled_time: scheduledTime,
        status: "skipped",
        notes: reason,
      });

      if (error) throw error;

      await fetchTodayLogs();
      toast.info("Reminder skipped");
    } catch (error) {
      console.error("Error skipping reminder:", error);
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("medicine_reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;

      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
      toast.success("Reminder deleted");
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const toggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("medicine_reminders")
        .update({ is_active: isActive })
        .eq("id", reminderId);

      if (error) throw error;

      await fetchReminders();
      toast.success(isActive ? "Reminder enabled" : "Reminder paused");
    } catch (error) {
      console.error("Error toggling reminder:", error);
    }
  };

  // Get upcoming reminders for today
  const getUpcomingReminders = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return reminders.flatMap((reminder) =>
      reminder.times_of_day
        .map((time) => {
          const [hours, minutes] = time.split(":").map(Number);
          const timeInMinutes = hours * 60 + minutes;
          return {
            reminder,
            time,
            timeInMinutes,
            isPast: timeInMinutes < currentTime,
            isTaken: todayLogs.some(
              (log) => log.reminder_id === reminder.id && log.status === "taken"
            ),
          };
        })
        .filter((item) => !item.isPast || !item.isTaken)
    ).sort((a, b) => a.timeInMinutes - b.timeInMinutes);
  };

  return {
    reminders,
    todayLogs,
    loading,
    createReminder,
    markAsTaken,
    skipReminder,
    deleteReminder,
    toggleReminder,
    getUpcomingReminders,
    refreshReminders: fetchReminders,
  };
}
