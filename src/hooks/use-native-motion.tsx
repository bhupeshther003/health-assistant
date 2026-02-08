import { useState, useCallback, useRef } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";

/**
 * Cross-platform motion/accelerometer hook.
 * Uses Capacitor Motion plugin on native, falls back to DeviceMotionEvent on web.
 */
export function useNativeMotion() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const listenerRef = useRef<any>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isNative() && isPluginAvailable("Motion")) {
      // Capacitor Motion plugin doesn't need explicit permission on Android
      setPermissionGranted(true);
      return true;
    }

    // Web: check for DeviceMotionEvent
    if (!("DeviceMotionEvent" in window)) {
      setPermissionGranted(false);
      return false;
    }

    // iOS 13+ requires explicit permission request
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission();
        const granted = result === "granted";
        setPermissionGranted(granted);
        return granted;
      } catch {
        setPermissionGranted(false);
        return false;
      }
    }

    // Android/other browsers: permission is implicit
    setPermissionGranted(true);
    return true;
  }, []);

  const startListening = useCallback(
    async (
      onAcceleration: (data: { x: number; y: number; z: number }) => void
    ) => {
      if (isNative() && isPluginAvailable("Motion")) {
        const { Motion } = await import("@capacitor/motion");
        listenerRef.current = await Motion.addListener("accel", (event) => {
          onAcceleration({
            x: event.acceleration.x,
            y: event.acceleration.y,
            z: event.acceleration.z,
          });
        });
        return;
      }

      // Web fallback
      const handler = (event: DeviceMotionEvent) => {
        const accel = event.accelerationIncludingGravity;
        if (accel) {
          onAcceleration({
            x: accel.x || 0,
            y: accel.y || 0,
            z: accel.z || 0,
          });
        }
      };
      window.addEventListener("devicemotion", handler);
      listenerRef.current = handler;
    },
    []
  );

  const stopListening = useCallback(async () => {
    if (isNative() && listenerRef.current?.remove) {
      await listenerRef.current.remove();
      listenerRef.current = null;
      return;
    }

    // Web fallback
    if (listenerRef.current) {
      window.removeEventListener("devicemotion", listenerRef.current);
      listenerRef.current = null;
    }
  }, []);

  return {
    permissionGranted,
    requestPermission,
    startListening,
    stopListening,
  };
}
