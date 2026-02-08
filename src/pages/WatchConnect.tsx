import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowLeft,
  Watch,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Heart,
  Droplets,
  Zap,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Plus,
  X,
  Check,
  Share2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useHealthData } from "@/hooks/use-health-data";
import { useLocation as useGeoLocation } from "@/hooks/use-location";
import { MobileNav } from "@/components/layout/MobileNav";

interface AvailableWatch {
  id: string;
  name: string;
  brand: string;
}

const AVAILABLE_WATCHES: AvailableWatch[] = [
  { id: "apple-watch-9", name: "Apple Watch Series 9", brand: "Apple" },
  { id: "galaxy-watch-6", name: "Galaxy Watch 6", brand: "Samsung" },
  { id: "fitbit-sense-2", name: "Fitbit Sense 2", brand: "Fitbit" },
  { id: "garmin-venu-3", name: "Garmin Venu 3", brand: "Garmin" },
  { id: "pixel-watch-2", name: "Pixel Watch 2", brand: "Google" },
];

const WatchConnect = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useGeoLocation();
  const {
    latestMetric,
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
  } = useHealthData();

  const [isScanning, setIsScanning] = useState(false);
  const [showPairModal, setShowPairModal] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);

  // Filter available watches that aren't already paired
  const pairedDeviceIds = devices.map((d) => d.device_id);
  const availableWatches = AVAILABLE_WATCHES.filter(
    (w) => !pairedDeviceIds.includes(w.id)
  );

  const connectedCount = devices.filter((d) => d.status === "connected").length;
  const disconnectedCount = devices.filter((d) => d.status === "disconnected").length;

  // Simulate real-time data from connected watches
  useEffect(() => {
    if (connectedCount === 0) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      return;
    }

    // Simulate health data every 10 seconds
    const interval = setInterval(async () => {
      const connectedDevice = devices.find((d) => d.status === "connected");
      if (!connectedDevice) return;

      const newHeartRate = Math.floor(Math.random() * 25) + 65;
      const newSystolic = Math.floor(Math.random() * 35) + 110;
      const newDiastolic = Math.floor(Math.random() * 20) + 70;
      const newSugar = Math.floor(Math.random() * 50) + 80;
      const newOxygen = Math.floor(Math.random() * 5) + 95;

      await recordMetric({
        device_id: connectedDevice.id,
        heart_rate: newHeartRate,
        blood_pressure_systolic: newSystolic,
        blood_pressure_diastolic: newDiastolic,
        blood_sugar: newSugar,
        oxygen_saturation: newOxygen,
        steps: (latestMetric?.steps || 0) + Math.floor(Math.random() * 15),
        calories: (latestMetric?.calories || 0) + Math.floor(Math.random() * 8),
      });
    }, 10000);

    setSimulationInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectedCount, devices]);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setShowPairModal(true);
    }, 3000);
  };

  const handlePair = async (watch: AvailableWatch) => {
    const { data, error } = await addDevice({
      device_id: watch.id,
      device_name: watch.name,
      device_brand: watch.brand,
    });

    if (error) {
      toast({
        title: "Pairing failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Simulate pairing completion
    setTimeout(async () => {
      if (data) {
        await updateDevice(data.id, {
          status: "connected",
          battery_level: Math.floor(Math.random() * 30) + 70,
          paired_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        });
        toast({
          title: "Watch connected!",
          description: `${watch.name} has been successfully paired.`,
        });
      }
    }, 2000);

    setShowPairModal(false);
  };

  const handleDisconnect = async (deviceId: string) => {
    await updateDevice(deviceId, {
      status: "disconnected",
      last_sync_at: new Date().toISOString(),
    });
    toast({
      title: "Watch disconnected",
      description: "The watch has been disconnected.",
    });
  };

  const handleReconnect = async (deviceId: string) => {
    await updateDevice(deviceId, { status: "pairing" });
    setTimeout(async () => {
      await updateDevice(deviceId, {
        status: "connected",
        battery_level: Math.floor(Math.random() * 30) + 70,
        last_sync_at: new Date().toISOString(),
      });
      toast({
        title: "Watch reconnected!",
        description: "Your watch is now syncing data.",
      });
    }, 2000);
  };

  const handleRemoveDevice = async (deviceId: string) => {
    const { error } = await removeDevice(deviceId);
    if (error) {
      toast({
        title: "Failed to remove device",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Device removed",
        description: "The device has been removed from your account.",
      });
    }
  };

  const handleShareEmergency = async (alertId: string, hospitalInfo: any) => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable location to share emergency details.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await shareEmergency(
      alertId,
      {
        name: hospitalInfo.name,
        address: hospitalInfo.address,
        phone: hospitalInfo.phone,
      },
      {
        latitude: location.latitude,
        longitude: location.longitude,
      }
    );

    if (error) {
      toast({
        title: "Failed to share",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unreadAlerts = alerts.filter((a) => !a.is_read && !a.is_resolved);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Please log in to connect your watch.</p>
          <Button onClick={() => navigate("/login")}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Watch className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Smart Watch</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Status Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <BluetoothConnected className="mx-auto mb-2 h-8 w-8 text-success" />
              <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
              <p className="text-sm text-muted-foreground">Connected</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <BluetoothOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{disconnectedCount}</p>
              <p className="text-sm text-muted-foreground">Disconnected</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 text-center">
              <Bluetooth className="mx-auto mb-2 h-8 w-8 text-primary" />
              <Button variant="outline" size="sm" onClick={handleScan} disabled={isScanning}>
                {isScanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Watch
                  </>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Real-time Health Data */}
          {latestMetric && connectedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Real-time Health Data</h2>
                <span className="text-xs text-muted-foreground">
                  Last updated: {new Date(latestMetric.recorded_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-primary/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Heart Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {latestMetric.heart_rate || "--"}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">bpm</span>
                  </p>
                </div>
                <div
                  className={`rounded-xl p-4 ${
                    (latestMetric.blood_pressure_systolic || 0) > 140
                      ? "bg-destructive/10"
                      : "bg-success/5"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-success" />
                    <span className="text-sm text-muted-foreground">Blood Pressure</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {latestMetric.blood_pressure_systolic || "--"}/
                    {latestMetric.blood_pressure_diastolic || "--"}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">mmHg</span>
                  </p>
                </div>
                <div
                  className={`rounded-xl p-4 ${
                    (latestMetric.blood_sugar || 0) > 180 ? "bg-destructive/10" : "bg-accent/5"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-accent-foreground" />
                    <span className="text-sm text-muted-foreground">Blood Sugar</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {latestMetric.blood_sugar || "--"}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">mg/dL</span>
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-warning" />
                    <span className="text-sm text-muted-foreground">Calories</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {latestMetric.calories || 0}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">kcal</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Health Alerts */}
          {unreadAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h2 className="text-lg font-semibold text-foreground">Health Alerts</h2>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {unreadAlerts.slice(0, 5).map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              alert.severity === "emergency" || alert.severity === "critical"
                                ? "bg-destructive"
                                : "bg-warning"
                            }`}
                          />
                          <h3 className="font-semibold text-foreground">{alert.title}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.triggered_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">{alert.message}</p>
                      {alert.suggestion && (
                        <div className="mb-3 rounded-lg bg-primary/5 p-3">
                          <p className="text-sm font-medium text-primary">💡 Suggestion:</p>
                          <p className="text-sm text-foreground">{alert.suggestion}</p>
                        </div>
                      )}
                      {alert.nearby_locations && (alert.nearby_locations as any[]).length > 0 && (
                        <div className="mb-3 space-y-2">
                          <p className="flex items-center gap-1 text-sm font-medium text-foreground">
                            <MapPin className="h-4 w-4" /> Nearby locations:
                          </p>
                          {(alert.nearby_locations as any[]).slice(0, 2).map((loc: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                            >
                              <div>
                                <span className="font-medium">{loc.name}</span>
                                <span className="ml-2 text-muted-foreground">{loc.distance}</span>
                              </div>
                              {(alert.severity === "critical" || alert.severity === "emergency") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleShareEmergency(alert.id, loc)}
                                >
                                  <Share2 className="mr-1 h-3 w-3" />
                                  Share
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAlertRead(alert.id)}
                        >
                          Mark Read
                        </Button>
                        <Button size="sm" variant="default" onClick={() => resolveAlert(alert.id)}>
                          Resolve
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Connected Watches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="mb-4 text-lg font-semibold text-foreground">Your Watches</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : devices.length === 0 ? (
              <div className="py-8 text-center">
                <Watch className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No watches connected yet.</p>
                <Button className="mt-4" onClick={handleScan}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Watch
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => (
                  <div
                    key={device.id}
                    className={`flex items-center justify-between rounded-xl border p-4 ${
                      device.status === "connected"
                        ? "border-success/30 bg-success/5"
                        : device.status === "pairing"
                        ? "border-primary/30 bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          device.status === "connected" ? "bg-success/20" : "bg-muted"
                        }`}
                      >
                        <Watch
                          className={`h-6 w-6 ${
                            device.status === "connected" ? "text-success" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{device.device_name}</p>
                        <p className="text-sm text-muted-foreground">{device.device_brand}</p>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          {device.status === "connected" && device.battery_level && (
                            <span className="text-success">🔋 {device.battery_level}%</span>
                          )}
                          {device.status === "pairing" && (
                            <span className="flex items-center gap-1 text-primary">
                              <RefreshCw className="h-3 w-3 animate-spin" /> Pairing...
                            </span>
                          )}
                          {device.last_sync_at && (
                            <span className="text-muted-foreground">
                              Synced: {new Date(device.last_sync_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {device.status === "connected" ? (
                        <Button variant="outline" size="sm" onClick={() => handleDisconnect(device.id)}>
                          Disconnect
                        </Button>
                      ) : device.status === "disconnected" ? (
                        <>
                          <Button variant="default" size="sm" onClick={() => handleReconnect(device.id)}>
                            Reconnect
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveDevice(device.id)}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Pair Modal */}
          <AnimatePresence>
            {showPairModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-foreground">Available Devices</h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowPairModal(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  {availableWatches.length > 0 ? (
                    <div className="space-y-3">
                      {availableWatches.map((watch) => (
                        <div
                          key={watch.id}
                          className="flex items-center justify-between rounded-xl border border-border p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                              <Watch className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{watch.name}</p>
                              <p className="text-sm text-muted-foreground">{watch.brand}</p>
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handlePair(watch)}>
                            <Bluetooth className="mr-2 h-4 w-4" />
                            Pair
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Check className="mx-auto mb-2 h-12 w-12 text-success" />
                      <p className="text-muted-foreground">All available watches are already paired!</p>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default WatchConnect;
