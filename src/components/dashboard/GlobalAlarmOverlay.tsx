 import { useEffect, useRef, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Pill, Clock, Check, X, Bell, Volume2, VolumeX, AlarmClock } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useAlarmReminders } from "@/hooks/use-alarm-reminders";
 
 // Audio context for generating alarm sound
 const createAlarmSound = () => {
   const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
   
   const playBeep = (frequency: number, duration: number, startTime: number) => {
     const oscillator = audioContext.createOscillator();
     const gainNode = audioContext.createGain();
     
     oscillator.connect(gainNode);
     gainNode.connect(audioContext.destination);
     
     oscillator.frequency.value = frequency;
     oscillator.type = "sine";
     
     gainNode.gain.setValueAtTime(0.3, startTime);
     gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
     
     oscillator.start(startTime);
     oscillator.stop(startTime + duration);
   };
 
   // Play alarm pattern
   const now = audioContext.currentTime;
   playBeep(880, 0.15, now);
   playBeep(880, 0.15, now + 0.2);
   playBeep(880, 0.15, now + 0.4);
   playBeep(1174, 0.3, now + 0.6);
 
   return audioContext;
 };
 
 const GlobalAlarmOverlay = () => {
   const { activeAlarms, acknowledgeAlarm, snoozeAlarm, dismissAlarm, reminders } = useAlarmReminders();
   const [muted, setMuted] = useState(false);
   const audioContextRef = useRef<AudioContext | null>(null);
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
 
   // Play alarm sound when there are active alarms
   useEffect(() => {
     if (activeAlarms.length > 0 && !muted) {
       // Play immediately
       audioContextRef.current = createAlarmSound();
       
       // Vibrate if supported
       if ("vibrate" in navigator) {
         navigator.vibrate([200, 100, 200, 100, 200]);
       }
 
       // Repeat every 3 seconds
       intervalRef.current = setInterval(() => {
         if (!muted) {
           audioContextRef.current = createAlarmSound();
           if ("vibrate" in navigator) {
             navigator.vibrate([200, 100, 200, 100, 200]);
           }
         }
       }, 3000);
     }
 
     return () => {
       if (intervalRef.current) {
         clearInterval(intervalRef.current);
       }
       if (audioContextRef.current) {
         audioContextRef.current.close();
       }
     };
   }, [activeAlarms.length, muted]);
 
   if (activeAlarms.length === 0) return null;
 
   return (
     <AnimatePresence>
       {/* Full screen overlay backdrop */}
       <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
       >
         {/* Alarm cards */}
         <div className="w-full max-w-md space-y-4 p-4">
           {activeAlarms.map((alarm) => {
             const reminder = reminders.find((r) => r.id === alarm.reminderId);
             const snoozeMinutes = reminder?.snooze_minutes || 5;
 
             return (
               <motion.div
                 key={`${alarm.reminderId}-${alarm.time}`}
                 initial={{ opacity: 0, scale: 0.9, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: -50 }}
                 className="overflow-hidden rounded-2xl border-2 border-primary bg-card shadow-2xl"
               >
                 {/* Pulsing Header */}
                 <motion.div
                   animate={{ 
                     backgroundColor: ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary))"] 
                   }}
                   transition={{ repeat: Infinity, duration: 1.5 }}
                   className="relative px-6 py-4"
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <motion.div
                         animate={{ rotate: [-10, 10, -10] }}
                         transition={{ repeat: Infinity, duration: 0.3 }}
                         className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20"
                       >
                         <AlarmClock className="h-8 w-8 text-primary-foreground" />
                       </motion.div>
                       <div>
                         <h2 className="text-xl font-bold text-primary-foreground">
                           Medicine Time!
                         </h2>
                         <p className="flex items-center gap-1 text-sm text-primary-foreground/80">
                           <Clock className="h-4 w-4" />
                           {alarm.time}
                         </p>
                       </div>
                     </div>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="text-primary-foreground hover:bg-primary-foreground/20"
                       onClick={() => setMuted(!muted)}
                     >
                       {muted ? (
                         <VolumeX className="h-6 w-6" />
                       ) : (
                         <Volume2 className="h-6 w-6" />
                       )}
                     </Button>
                   </div>
                 </motion.div>
 
                 {/* Content */}
                 <div className="p-6">
                   <div className="mb-6 flex items-center gap-4">
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                       <Pill className="h-8 w-8 text-primary" />
                     </div>
                     <div>
                       <h3 className="text-2xl font-bold text-foreground">
                         {alarm.medicineName}
                       </h3>
                       {alarm.dosage && (
                         <p className="text-lg text-muted-foreground">
                           {alarm.dosage}
                         </p>
                       )}
                     </div>
                   </div>
 
                   {/* Actions */}
                   <div className="grid grid-cols-2 gap-3">
                     <Button
                       size="lg"
                       className="h-14 gap-2 text-lg"
                       onClick={() => acknowledgeAlarm(alarm.reminderId, alarm.time)}
                     >
                       <Check className="h-6 w-6" />
                       I Took It
                     </Button>
                     <Button
                       size="lg"
                       variant="secondary"
                       className="h-14 gap-2"
                       onClick={() => snoozeAlarm(alarm.reminderId, alarm.time, snoozeMinutes)}
                     >
                       Snooze {snoozeMinutes}m
                     </Button>
                   </div>
                   <Button
                     variant="ghost"
                     className="mt-3 w-full text-muted-foreground"
                     onClick={() => dismissAlarm(alarm.reminderId, alarm.time)}
                   >
                     <X className="mr-2 h-4 w-4" />
                     Skip This Time
                   </Button>
                 </div>
               </motion.div>
             );
           })}
         </div>
       </motion.div>
     </AnimatePresence>
   );
 };
 
 export default GlobalAlarmOverlay;