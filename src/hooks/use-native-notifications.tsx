import { useCallback } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";

/**
 * Cross-platform notification hook.
 * Uses Capacitor LocalNotifications on native, falls back to Web Notification API.
 */
export function useNativeNotifications() {
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNative() && isPluginAvailable("LocalNotifications")) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const result = await LocalNotifications.requestPermissions();
      return result.display === "granted";
    }

    // Web fallback
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      return perm === "granted";
    }
    return false;
  }, []);

  const scheduleNotification = useCallback(
    async (options: {
      id: number;
      title: string;
      body: string;
      scheduleAt?: Date;
      sound?: string;
      ongoing?: boolean;
    }) => {
      if (isNative() && isPluginAvailable("LocalNotifications")) {
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        const notification: any = {
          id: options.id,
          title: options.title,
          body: options.body,
          sound: options.sound || "alarm_default.wav",
          channelId: "medicine-alarms",
          importance: 5, // MAX importance for alarm-like behavior
          ongoing: options.ongoing ?? false,
          autoCancel: false,
        };

        if (options.scheduleAt) {
          notification.schedule = { at: options.scheduleAt, allowWhileIdle: true };
        }

        await LocalNotifications.schedule({ notifications: [notification] });
        return true;
      }

      // Web fallback
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(options.title, {
          body: options.body,
          icon: "/favicon.ico",
          requireInteraction: true,
        });
        return true;
      }
      return false;
    },
    []
  );

  const cancelNotification = useCallback(async (id: number) => {
    if (isNative() && isPluginAvailable("LocalNotifications")) {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.cancel({ notifications: [{ id }] });
    }
  }, []);

  const scheduleMedicineAlarm = useCallback(
    async (options: {
      reminderId: string;
      medicineName: string;
      dosage?: string;
      time: string; // HH:MM format
      repeatDaily?: boolean;
    }) => {
      // Generate a stable numeric ID from the reminder ID
      const id = Math.abs(hashCode(options.reminderId + options.time));

      const [hours, minutes] = options.time.split(":").map(Number);
      const now = new Date();
      const scheduleAt = new Date(now);
      scheduleAt.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (scheduleAt <= now) {
        scheduleAt.setDate(scheduleAt.getDate() + 1);
      }

      await scheduleNotification({
        id,
        title: `💊 Medicine Time: ${options.medicineName}`,
        body: options.dosage
          ? `Take ${options.dosage} now`
          : "Time to take your medicine!",
        scheduleAt,
        sound: "alarm_default.wav",
        ongoing: true,
      });

      return id;
    },
    [scheduleNotification]
  );

  return {
    requestPermission,
    scheduleNotification,
    cancelNotification,
    scheduleMedicineAlarm,
  };
}

/** Simple string hash to generate numeric IDs */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
