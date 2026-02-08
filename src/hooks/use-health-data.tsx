import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

interface HealthMetric {
  id: string;
  user_id: string;
  device_id: string | null;
  heart_rate: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  blood_sugar: number | null;
  steps: number;
  calories: number;
  oxygen_saturation: number | null;
  body_temperature: number | null;
  recorded_at: string;
  created_at: string;
}

interface HealthAlert {
  id: string;
  user_id: string;
  metric_id: string | null;
  alert_type: string;
  severity: string;
  title: string;
  message: string | null;
  suggestion: string | null;
  nearby_locations: any[];
  is_read: boolean;
  is_resolved: boolean;
  emergency_shared: boolean;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
}

interface Device {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_brand: string | null;
  device_type: string;
  status: "connected" | "disconnected" | "pairing";
  battery_level: number | null;
  last_sync_at: string | null;
  paired_at: string | null;
  created_at: string;
}

export function useHealthData() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [latestMetric, setLatestMetric] = useState<HealthMetric | null>(null);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHealthData = useCallback(async () => {
    if (!user) return;

    try {
      const [metricsResult, alertsResult, devicesResult] = await Promise.all([
        supabase
          .from("health_metrics")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: false })
          .limit(50),
        supabase
          .from("health_alerts")
          .select("*")
          .eq("user_id", user.id)
          .order("triggered_at", { ascending: false })
          .limit(20),
        supabase
          .from("devices")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (metricsResult.data) {
        setMetrics(metricsResult.data as HealthMetric[]);
        setLatestMetric(metricsResult.data[0] as HealthMetric || null);
      }

      if (alertsResult.data) {
        setAlerts(alertsResult.data as HealthAlert[]);
      }

      if (devicesResult.data) {
        setDevices(devicesResult.data as Device[]);
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const metricsChannel = supabase
      .channel("health_metrics_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_metrics",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newMetric = payload.new as HealthMetric;
          setMetrics((prev) => [newMetric, ...prev.slice(0, 49)]);
          setLatestMetric(newMetric);
        }
      )
      .subscribe();

    const alertsChannel = supabase
      .channel("health_alerts_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "health_alerts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as HealthAlert;
          setAlerts((prev) => [newAlert, ...prev.slice(0, 19)]);

          // Show toast notification for new alerts
          const variant = newAlert.severity === "critical" || newAlert.severity === "emergency"
            ? "destructive"
            : "default";

          toast({
            title: `⚠️ ${newAlert.title}`,
            description: newAlert.message || "Tap to view details",
            variant,
          });
        }
      )
      .subscribe();

    const devicesChannel = supabase
      .channel("devices_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "devices",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDevices((prev) => [payload.new as Device, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setDevices((prev) =>
              prev.map((d) =>
                d.id === (payload.new as Device).id ? (payload.new as Device) : d
              )
            );
          } else if (payload.eventType === "DELETE") {
            setDevices((prev) =>
              prev.filter((d) => d.id !== (payload.old as Device).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(devicesChannel);
    };
  }, [user, toast]);

  const recordMetric = async (metric: Partial<HealthMetric>) => {
    if (!session) {
      return { error: new Error("Not authenticated") };
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-health-metrics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(metric),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to record metric");
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      console.error("Error recording metric:", error);
      return { error: error as Error };
    }
  };

  const addDevice = async (device: Partial<Device>) => {
    if (!user) {
      return { error: new Error("Not authenticated") };
    }

    const { data, error } = await supabase
      .from("devices")
      .insert({
        user_id: user.id,
        device_id: device.device_id || crypto.randomUUID(),
        device_name: device.device_name,
        device_brand: device.device_brand,
        device_type: device.device_type || "smartwatch",
        status: "pairing",
      })
      .select()
      .single();

    return { data: data as Device | null, error };
  };

  const updateDevice = async (deviceId: string, updates: Partial<Device>) => {
    const { error } = await supabase
      .from("devices")
      .update(updates)
      .eq("id", deviceId);

    return { error };
  };

  const removeDevice = async (deviceId: string) => {
    const { error } = await supabase
      .from("devices")
      .delete()
      .eq("id", deviceId);

    return { error };
  };

  const markAlertRead = async (alertId: string) => {
    const { error } = await supabase
      .from("health_alerts")
      .update({ is_read: true })
      .eq("id", alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      );
    }

    return { error };
  };

  const resolveAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("health_alerts")
      .update({ is_resolved: true, resolved_at: new Date().toISOString() })
      .eq("id", alertId);

    if (!error) {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, is_resolved: true, resolved_at: new Date().toISOString() }
            : a
        )
      );
    }

    return { error };
  };

  const shareEmergency = async (
    alertId: string,
    hospital: { name: string; address: string; phone?: string },
    location: { latitude: number; longitude: number }
  ) => {
    if (!session) {
      return { error: new Error("Not authenticated") };
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/share-emergency`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            alert_id: alertId,
            hospital_name: hospital.name,
            hospital_address: hospital.address,
            hospital_phone: hospital.phone,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to share emergency");
      }

      const result = await response.json();
      toast({
        title: "Emergency shared",
        description: `Your health information has been shared with ${hospital.name}`,
      });
      return { data: result, error: null };
    } catch (error) {
      console.error("Error sharing emergency:", error);
      return { error: error as Error };
    }
  };

  return {
    latestMetric,
    metrics,
    alerts,
    devices,
    loading,
    recordMetric,
    addDevice,
    updateDevice,
    removeDevice,
    markAlertRead,
    resolveAlert,
    shareEmergency,
    refreshHealthData: fetchHealthData,
  };
}
