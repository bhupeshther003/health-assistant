import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import { useNativeNotifications } from "./use-native-notifications";
import { useNativeHaptics } from "./use-native-haptics";

interface AlarmReminder {
  id: string;
  medicine_name: string;
  dosage: string | null;
  times_of_day: string[];
  frequency: string;
  is_active: boolean;
  alarm_sound: string;
  alarm_vibrate: boolean;
  repeat_until_acknowledged: boolean;
  snooze_minutes: number;
}

interface ActiveAlarm {
  reminderId: string;
  medicineName: string;
  dosage: string | null;
  time: string;
  isRinging: boolean;
}

// Pre-load alarm sounds
const ALARM_SOUNDS = {
  default: "/alarm-default.mp3",
  gentle: "/alarm-gentle.mp3",
  urgent: "/alarm-urgent.mp3",
};

export function useAlarmReminders() {
  const { user } = useAuth();
  const { scheduleMedicineAlarm, cancelNotification } = useNativeNotifications();
  const { alarmVibrate, notification: hapticNotify } = useNativeHaptics();
  const [reminders, setReminders] = useState<AlarmReminder[]>([]);
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("medicine_reminders")
        .select("id, medicine_name, dosage, times_of_day, frequency, is_active, alarm_sound, alarm_vibrate, repeat_until_acknowledged, snooze_minutes")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;
      setReminders((data as AlarmReminder[]) || []);
    } catch (error) {
      console.error("Error fetching alarm reminders:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if it's time for any alarm
  const checkAlarms = useCallback(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    reminders.forEach((reminder) => {
      if (!reminder.is_active) return;

      reminder.times_of_day.forEach((time) => {
        // Check if this is the exact minute
        if (time === currentTime) {
          // Check if alarm is already active
          const isAlreadyActive = activeAlarms.some(
            (a) => a.reminderId === reminder.id && a.time === time
          );

          if (!isAlreadyActive) {
            triggerAlarm(reminder, time);
          }
        }
      });
    });
  }, [reminders, activeAlarms]);

  // Trigger alarm with sound and vibration
  const triggerAlarm = useCallback((reminder: AlarmReminder, time: string) => {
    const newAlarm: ActiveAlarm = {
      reminderId: reminder.id,
      medicineName: reminder.medicine_name,
      dosage: reminder.dosage,
      time,
      isRinging: true,
    };

    setActiveAlarms((prev) => [...prev, newAlarm]);

    // Play sound
    playAlarmSound(reminder.alarm_sound);

    // Native haptic feedback
    alarmVibrate();

    // Fire native notification (works in background & lock screen on Android)
    scheduleMedicineAlarm({
      reminderId: reminder.id,
      medicineName: reminder.medicine_name,
      dosage: reminder.dosage || undefined,
      time,
    });

    // Vibrate if supported and enabled
    if (reminder.alarm_vibrate && navigator.vibrate) {
      // Vibrate pattern: 500ms on, 200ms off, repeat
      const vibratePattern = [500, 200, 500, 200, 500];
      navigator.vibrate(vibratePattern);
    }

    // Show persistent toast notification
    toast.warning(`💊 Time to take ${reminder.medicine_name}`, {
      description: reminder.dosage ? `Dosage: ${reminder.dosage}` : "Time for your medicine!",
      duration: Infinity,
      action: {
        label: "Taken",
        onClick: () => acknowledgeAlarm(reminder.id, time),
      },
    });

    // If repeat until acknowledged, set up repeat interval
    if (reminder.repeat_until_acknowledged) {
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }
      repeatIntervalRef.current = setInterval(() => {
        const stillActive = activeAlarms.some(
          (a) => a.reminderId === reminder.id && a.time === time && a.isRinging
        );
        if (stillActive) {
          playAlarmSound(reminder.alarm_sound);
          if (reminder.alarm_vibrate && navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
          }
        }
      }, 30000); // Repeat every 30 seconds
    }
  }, [activeAlarms]);

  // Play alarm sound
  const playAlarmSound = useCallback((soundType: string) => {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different sound types
      const frequencies: Record<string, number> = {
        default: 800,
        gentle: 400,
        urgent: 1000,
      };

      oscillator.frequency.value = frequencies[soundType] || 800;
      oscillator.type = soundType === "gentle" ? "sine" : "square";

      // Envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);

      // Play beep 3 times
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = frequencies[soundType] || 800;
        osc2.type = soundType === "gentle" ? "sine" : "square";
        gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.8);
      }, 1200);

      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = frequencies[soundType] || 800;
        osc3.type = soundType === "gentle" ? "sine" : "square";
        gain3.gain.setValueAtTime(0.5, audioContext.currentTime);
        gain3.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.8);
        osc3.start();
        osc3.stop(audioContext.currentTime + 0.8);
      }, 2400);
    } catch (error) {
      console.error("Error playing alarm sound:", error);
    }
  }, []);

  // Acknowledge alarm
  const acknowledgeAlarm = useCallback(async (reminderId: string, time: string) => {
    // Stop vibration
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    // Stop repeat interval
    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    // Remove from active alarms
    setActiveAlarms((prev) =>
      prev.filter((a) => !(a.reminderId === reminderId && a.time === time))
    );

    // Log that medicine was taken
    if (user) {
      try {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("medicine_logs").insert({
          user_id: user.id,
          reminder_id: reminderId,
          scheduled_time: `${today}T${time}:00`,
          status: "taken",
          taken_at: new Date().toISOString(),
        });

        // Update last_taken_at on reminder
        await supabase
          .from("medicine_reminders")
          .update({ last_taken_at: new Date().toISOString() })
          .eq("id", reminderId);

        toast.success("Medicine marked as taken! 💪");
      } catch (error) {
        console.error("Error logging medicine:", error);
      }
    }
  }, [user]);

  // Snooze alarm
  const snoozeAlarm = useCallback((reminderId: string, time: string, snoozeMinutes: number = 5) => {
    // Stop current alarm
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    // Remove from active alarms temporarily
    setActiveAlarms((prev) =>
      prev.filter((a) => !(a.reminderId === reminderId && a.time === time))
    );

    toast.info(`Snoozed for ${snoozeMinutes} minutes`);

    // Re-trigger after snooze period
    setTimeout(() => {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (reminder) {
        triggerAlarm(reminder, time);
      }
    }, snoozeMinutes * 60 * 1000);
  }, [reminders, triggerAlarm]);

  // Dismiss alarm (skip)
  const dismissAlarm = useCallback(async (reminderId: string, time: string) => {
    // Stop vibration and sound
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }

    if (repeatIntervalRef.current) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }

    // Remove from active alarms
    setActiveAlarms((prev) =>
      prev.filter((a) => !(a.reminderId === reminderId && a.time === time))
    );

    // Log as skipped
    if (user) {
      try {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("medicine_logs").insert({
          user_id: user.id,
          reminder_id: reminderId,
          scheduled_time: `${today}T${time}:00`,
          status: "skipped",
        });
      } catch (error) {
        console.error("Error logging skipped medicine:", error);
      }
    }

    toast.info("Reminder dismissed");
  }, [user]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
    return false;
  }, []);

  useEffect(() => {
    fetchReminders();
    requestPermission();
  }, [fetchReminders, requestPermission]);

  // Check alarms every minute
  useEffect(() => {
    checkIntervalRef.current = setInterval(checkAlarms, 60000);
    // Also check immediately
    checkAlarms();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
      }
    };
  }, [checkAlarms]);

  return {
    reminders,
    activeAlarms,
    loading,
    acknowledgeAlarm,
    snoozeAlarm,
    dismissAlarm,
    playAlarmSound,
    refreshReminders: fetchReminders,
  };
}
