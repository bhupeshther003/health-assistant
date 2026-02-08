import { motion, AnimatePresence } from "framer-motion";
import { Pill, Clock, Check, X, Bell, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlarmReminders } from "@/hooks/use-alarm-reminders";

const AlarmNotification = () => {
  const { activeAlarms, acknowledgeAlarm, snoozeAlarm, dismissAlarm, reminders } =
    useAlarmReminders();

  if (activeAlarms.length === 0) return null;

  return (
    <AnimatePresence>
      {activeAlarms.map((alarm) => {
        const reminder = reminders.find((r) => r.id === alarm.reminderId);
        const snoozeMinutes = reminder?.snooze_minutes || 5;

        return (
          <motion.div
            key={`${alarm.reminderId}-${alarm.time}`}
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className="fixed left-1/2 top-20 z-50 w-[90%] max-w-sm -translate-x-1/2 transform"
          >
            <div className="overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-2xl">
              {/* Animated Header */}
              <div className="relative overflow-hidden bg-primary px-4 py-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <Bell className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20"
                  >
                    <Pill className="h-5 w-5 text-primary-foreground" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-primary-foreground">Medicine Time!</p>
                    <p className="text-sm text-primary-foreground/80">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {alarm.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="mb-1 text-lg font-bold text-foreground">
                  {alarm.medicineName}
                </h3>
                {alarm.dosage && (
                  <p className="mb-4 text-sm text-muted-foreground">
                    Dosage: {alarm.dosage}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => acknowledgeAlarm(alarm.reminderId, alarm.time)}
                  >
                    <Check className="h-4 w-4" />
                    Taken
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => snoozeAlarm(alarm.reminderId, alarm.time, snoozeMinutes)}
                  >
                    Snooze ({snoozeMinutes}m)
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => dismissAlarm(alarm.reminderId, alarm.time)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pulsing border effect */}
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
              />
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
};

export default AlarmNotification;
