import { useCallback } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";

/**
 * Cross-platform haptic feedback hook.
 * Uses Capacitor Haptics on native, falls back to navigator.vibrate on web.
 */
export function useNativeHaptics() {
  const impact = useCallback(async (style: "light" | "medium" | "heavy" = "medium") => {
    if (isNative() && isPluginAvailable("Haptics")) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      const styleMap = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      };
      await Haptics.impact({ style: styleMap[style] });
    } else if ("vibrate" in navigator) {
      const durationMap = { light: 30, medium: 50, heavy: 100 };
      navigator.vibrate(durationMap[style]);
    }
  }, []);

  const notification = useCallback(async (type: "success" | "warning" | "error" = "success") => {
    if (isNative() && isPluginAvailable("Haptics")) {
      const { Haptics, NotificationType } = await import("@capacitor/haptics");
      const typeMap = {
        success: NotificationType.Success,
        warning: NotificationType.Warning,
        error: NotificationType.Error,
      };
      await Haptics.notification({ type: typeMap[type] });
    } else if ("vibrate" in navigator) {
      const patternMap = {
        success: [50],
        warning: [50, 100, 50],
        error: [100, 50, 100, 50, 100],
      };
      navigator.vibrate(patternMap[type]);
    }
  }, []);

  const vibrate = useCallback(async (duration: number = 300) => {
    if (isNative() && isPluginAvailable("Haptics")) {
      const { Haptics } = await import("@capacitor/haptics");
      await Haptics.vibrate({ duration });
    } else if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  }, []);

  /** Alarm-style vibration pattern that repeats */
  const alarmVibrate = useCallback(async () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
    if (isNative() && isPluginAvailable("Haptics")) {
      const { Haptics } = await import("@capacitor/haptics");
      await Haptics.vibrate({ duration: 500 });
    }
  }, []);

  return { impact, notification, vibrate, alarmVibrate };
}
