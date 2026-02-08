import { useState, useCallback } from "react";
import { isNative, isPluginAvailable } from "@/lib/capacitor";

interface DeviceInfo {
  model: string;
  platform: string;
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}

interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

/**
 * Hook for native device information and network status.
 * Falls back gracefully on web.
 */
export function useNativeDevice() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    connected: navigator.onLine,
    connectionType: "unknown",
  });

  const fetchDeviceInfo = useCallback(async () => {
    if (isNative() && isPluginAvailable("Device")) {
      const { Device } = await import("@capacitor/device");
      const info = await Device.getInfo();
      const battery = await Device.getBatteryInfo();

      const result: DeviceInfo = {
        model: info.model,
        platform: info.platform,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        batteryLevel: battery.batteryLevel,
        isCharging: battery.isCharging,
      };
      setDeviceInfo(result);
      return result;
    }

    // Web fallback
    const webInfo: DeviceInfo = {
      model: "Web Browser",
      platform: "web",
      operatingSystem: navigator.platform,
      osVersion: navigator.userAgent,
      manufacturer: "Unknown",
      isVirtual: false,
    };
    setDeviceInfo(webInfo);
    return webInfo;
  }, []);

  const watchNetwork = useCallback(async () => {
    if (isNative() && isPluginAvailable("Network")) {
      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      setNetworkStatus({
        connected: status.connected,
        connectionType: status.connectionType,
      });

      Network.addListener("networkStatusChange", (s) => {
        setNetworkStatus({
          connected: s.connected,
          connectionType: s.connectionType,
        });
      });
    } else {
      // Web fallback
      window.addEventListener("online", () =>
        setNetworkStatus((prev) => ({ ...prev, connected: true }))
      );
      window.addEventListener("offline", () =>
        setNetworkStatus((prev) => ({ ...prev, connected: false }))
      );
    }
  }, []);

  return {
    deviceInfo,
    networkStatus,
    fetchDeviceInfo,
    watchNetwork,
  };
}
