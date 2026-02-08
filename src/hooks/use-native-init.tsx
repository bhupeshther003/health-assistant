import { useEffect, useRef } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";
import { useNativeNotifications } from "@/hooks/use-native-notifications";
import { useNativeDevice } from "@/hooks/use-native-device";

/**
 * Initializes all native Capacitor plugins when running on a native device.
 * Should be called once at the app root level.
 */
export function useNativeInit() {
  const { requestPermission } = useNativeNotifications();
  const { fetchDeviceInfo, watchNetwork } = useNativeDevice();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      if (!isNative()) return;

      // Configure status bar
      if (isPluginAvailable("StatusBar")) {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#0F172A" });
      }

      // Hide splash screen
      if (isPluginAvailable("SplashScreen")) {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      }

      // Set up notification channel for Android (alarms)
      if (isPluginAvailable("LocalNotifications")) {
        const { LocalNotifications } = await import(
          "@capacitor/local-notifications"
        );
        await LocalNotifications.createChannel({
          id: "medicine-alarms",
          name: "Medicine Alarms",
          description: "High-priority medicine reminder alarms",
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: "alarm_default.wav",
          lights: true,
          lightColor: "#14B8A6",
        });

        // Listen for notification actions
        LocalNotifications.addListener(
          "localNotificationActionPerformed",
          (notification) => {
            console.log("Notification action:", notification);
            // The app will navigate to the relevant screen when opened from notification
          }
        );
      }

      // Handle Android back button
      if (isPluginAvailable("App")) {
        const { App } = await import("@capacitor/app");
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
      }

      // Request notification permission
      await requestPermission();

      // Fetch device info and start network monitoring
      await fetchDeviceInfo();
      await watchNetwork();
    };

    init().catch(console.error);
  }, [requestPermission, fetchDeviceInfo, watchNetwork]);
}
