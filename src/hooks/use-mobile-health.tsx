 import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

interface MobileHealthData {
  id: string;
  user_id: string;
  recorded_date: string;
  steps: number;
  distance_meters: number;
  calories_burned: number;
  active_minutes: number;
  floors_climbed: number;
  standing_hours: number;
  movement_score: number | null;
  data_source: string;
   raw_sensor_data: unknown;
  created_at: string;
}

interface DeviceMotionData {
  acceleration: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  interval: number;
}

 interface PermissionState {
   motion: boolean | null;
   notification: boolean | null;
 }
 
export function useMobileHealth() {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState<MobileHealthData | null>(null);
  const [weekData, setWeekData] = useState<MobileHealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
   const [permissionState, setPermissionState] = useState<PermissionState>({
     motion: null,
     notification: null,
   });
   const [error, setError] = useState<string | null>(null);

  // Local step tracking state
  const [localSteps, setLocalSteps] = useState(0);
   const lastAccelerationRef = useRef<number | null>(null);
   const lastStepTimeRef = useRef<number>(0);
   const stepBufferRef = useRef<number[]>([]);

  const fetchTodayData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("mobile_health_data")
        .select("*")
        .eq("user_id", user.id)
        .eq("recorded_date", today)
         .maybeSingle();

       if (error) throw error;
       setTodayData(data as MobileHealthData | null);
      if (data?.steps) {
        setLocalSteps(data.steps);
      }
    } catch (error) {
      console.error("Error fetching today's health data:", error);
       setError("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchWeekData = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("mobile_health_data")
        .select("*")
        .eq("user_id", user.id)
        .gte("recorded_date", weekAgo.toISOString().split("T")[0])
        .order("recorded_date", { ascending: true });

      if (error) throw error;
       setWeekData((data || []) as MobileHealthData[]);
    } catch (error) {
      console.error("Error fetching week data:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayData();
    fetchWeekData();
  }, [fetchTodayData, fetchWeekData]);

  // Step detection using device motion
   const handleMotion = useCallback((event: DeviceMotionEvent): void => {
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const magnitude = Math.sqrt(
      (acceleration.x || 0) ** 2 +
      (acceleration.y || 0) ** 2 +
      (acceleration.z || 0) ** 2
    );

     const now = Date.now();
     const stepThreshold = 11; // Adjusted for better detection
     const minTimeBetweenSteps = 250; // ms

     // Use refs to avoid stale closure issues
     if (lastAccelerationRef.current !== null) {
       const delta = Math.abs(magnitude - lastAccelerationRef.current);
       
       // Add to buffer for smoothing
       stepBufferRef.current.push(delta);
       if (stepBufferRef.current.length > 5) {
         stepBufferRef.current.shift();
       }
 
       // Check if we have a step
       const avgDelta = stepBufferRef.current.reduce((a, b) => a + b, 0) / stepBufferRef.current.length;
       
       if (delta > stepThreshold && now - lastStepTimeRef.current > minTimeBetweenSteps) {
         setLocalSteps((prev) => {
           const newSteps = prev + 1;
           // Provide haptic feedback every 100 steps
           if (newSteps % 100 === 0 && "vibrate" in navigator) {
             navigator.vibrate(50);
           }
           return newSteps;
         });
         lastStepTimeRef.current = now;
      }
    }

     lastAccelerationRef.current = magnitude;
   }, []);

  const requestMotionPermission = async (): Promise<boolean> => {
    // Check if DeviceMotionEvent is available
    if (!("DeviceMotionEvent" in window)) {
       setError("Motion sensors not available on this device. Try entering data manually.");
       toast.error("Motion sensors not available", {
         description: "You can still enter steps manually",
       });
      return false;
    }

    // For iOS 13+, we need to request permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission === "granted") {
           setPermissionState((prev) => ({ ...prev, motion: true }));
           setError(null);
          return true;
        } else {
           setPermissionState((prev) => ({ ...prev, motion: false }));
           setError("Motion permission denied. Please enable in Settings.");
           toast.error("Motion permission denied", {
             description: "Enable motion access in your device settings",
           });
          return false;
        }
      } catch (error) {
        console.error("Error requesting motion permission:", error);
         setError("Failed to request motion permission");
        return false;
      }
    }

    // For other devices, permission is implicit
     setPermissionState((prev) => ({ ...prev, motion: true }));
     setError(null);
    return true;
  };

  const startTracking = async () => {
     setError(null);
    const hasPermission = await requestMotionPermission();
    if (!hasPermission) return;

    window.addEventListener("devicemotion", handleMotion);
    setIsTracking(true);
     toast.success("Activity tracking started", {
       description: "Your steps are now being counted",
     });
  };

  const stopTracking = () => {
    window.removeEventListener("devicemotion", handleMotion);
    setIsTracking(false);
     saveData(); // Save data when stopping
     toast.info("Activity tracking paused", {
       description: "Your progress has been saved",
     });
  };

  // Save data periodically
   const saveData = useCallback(async (): Promise<boolean> => {
     if (!user) return false;

    try {
      const today = new Date().toISOString().split("T")[0];
      
       // Get existing data to merge
       const existingSteps = todayData?.steps || 0;
       const stepsToSave = Math.max(localSteps, existingSteps);
 
      // Calculate derived metrics
       const caloriesBurned = Math.round(stepsToSave * 0.04);
       const distanceMeters = Math.round(stepsToSave * 0.76);
       const activeMinutes = Math.round(stepsToSave / 100);
       const movementScore = Math.min(100, Math.round((stepsToSave / 10000) * 100));

      const { data, error } = await supabase
        .from("mobile_health_data")
        .upsert({
          user_id: user.id,
          recorded_date: today,
           steps: stepsToSave,
          distance_meters: distanceMeters,
          calories_burned: caloriesBurned,
          active_minutes: activeMinutes,
          movement_score: movementScore,
           data_source: isTracking ? "sensor" : "web",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,recorded_date",
        })
        .select()
        .single();

      if (error) throw error;
       setTodayData(data as MobileHealthData);
       return true;
    } catch (error) {
      console.error("Error saving health data:", error);
       return false;
    }
   }, [user, localSteps, todayData, isTracking]);

  // Auto-save every 5 minutes while tracking
  useEffect(() => {
    if (!isTracking) return;

     // Save more frequently - every 2 minutes
     const interval = setInterval(saveData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isTracking, saveData]);

  // Save when stopping tracking
  useEffect(() => {
    return () => {
      if (isTracking) {
        saveData();
      }
    };
  }, [isTracking, saveData]);

  // Manual data entry for when sensors aren't available
  const updateManually = async (data: Partial<MobileHealthData>) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
       
       // Extract only the fields that are valid for the database
       const { id, created_at, raw_sensor_data, ...validData } = data;
      
      const { data: result, error } = await supabase
        .from("mobile_health_data")
        .upsert({
          user_id: user.id,
          recorded_date: today,
          data_source: "manual",
           ...validData,
        }, {
          onConflict: "user_id,recorded_date",
        })
        .select()
        .single();

      if (error) throw error;
       setTodayData(result as MobileHealthData);
      setLocalSteps(result.steps || 0);
      toast.success("Health data updated");
    } catch (error) {
      console.error("Error updating health data:", error);
      toast.error("Failed to update data");
    }
  };

  // Generate demo data for testing
  const generateDemoData = async () => {
    if (!user) return;

    try {
      const today = new Date();
      const demoData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const steps = Math.floor(Math.random() * 8000) + 4000;
        demoData.push({
          user_id: user.id,
          recorded_date: date.toISOString().split("T")[0],
          steps,
          distance_meters: Math.round(steps * 0.76),
          calories_burned: Math.round(steps * 0.04),
          active_minutes: Math.round(steps / 100),
          floors_climbed: Math.floor(Math.random() * 15),
          standing_hours: Math.floor(Math.random() * 8) + 4,
          movement_score: Math.min(100, Math.round((steps / 10000) * 100)),
          data_source: "demo",
        });
      }

      const { error } = await supabase
        .from("mobile_health_data")
        .upsert(demoData, { onConflict: "user_id,recorded_date" });

      if (error) throw error;

      await Promise.all([fetchTodayData(), fetchWeekData()]);
      toast.success("Demo data generated");
    } catch (error) {
      console.error("Error generating demo data:", error);
      toast.error("Failed to generate demo data");
    }
  };

   // Sync function for manual refresh
   const syncData = useCallback(async (): Promise<boolean> => {
     const saved = await saveData();
     if (saved) {
       await fetchTodayData();
       await fetchWeekData();
       toast.success("Data synced successfully");
     }
     return saved;
   }, [saveData, fetchTodayData, fetchWeekData]);
 
  return {
    todayData,
    weekData,
    loading,
    isTracking,
    localSteps,
     permissionGranted: permissionState.motion,
     permissionState,
     error,
    startTracking,
    stopTracking,
    updateManually,
    generateDemoData,
    saveData,
     syncData,
    refreshData: fetchTodayData,
  };
}
