import { useCallback } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";
import { Preferences } from "@capacitor/preferences";

/**
 * Cross-platform offline storage hook.
 * Uses Capacitor Preferences on native, localStorage on web.
 */
export function useOfflineStorage() {
  const setItem = useCallback(async (key: string, value: string) => {
    if (isNative() && isPluginAvailable("Preferences")) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }, []);

  const getItem = useCallback(async (key: string): Promise<string | null> => {
    if (isNative() && isPluginAvailable("Preferences")) {
      const { value } = await Preferences.get({ key });
      return value;
    }
    return localStorage.getItem(key);
  }, []);

  const removeItem = useCallback(async (key: string) => {
    if (isNative() && isPluginAvailable("Preferences")) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }, []);

  /** Store data for offline use, then sync when online */
  const cacheForOffline = useCallback(
    async (key: string, data: unknown) => {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now(),
      });
      await setItem(`offline_${key}`, serialized);
    },
    [setItem]
  );

  /** Retrieve cached offline data */
  const getCached = useCallback(
    async <T = unknown>(key: string): Promise<{ data: T; timestamp: number } | null> => {
      const raw = await getItem(`offline_${key}`);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    [getItem]
  );

  return { setItem, getItem, removeItem, cacheForOffline, getCached };
}
