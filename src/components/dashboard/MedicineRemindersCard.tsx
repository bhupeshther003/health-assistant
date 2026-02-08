 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Pill,
   Plus,
   Clock,
   Check,
   X,
   Bell,
   Edit2,
   Trash2,
   MoreVertical,
   ChevronRight,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogDescription,
 } from "@/components/ui/dialog";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { useMedicineReminders } from "@/hooks/use-medicine-reminders";
 import { format } from "date-fns";
 
 interface MedicineRemindersCardProps {
   compact?: boolean;
 }
 
 const MedicineRemindersCard = ({ compact = false }: MedicineRemindersCardProps) => {
   const {
     reminders,
     todayLogs,
     loading,
     createReminder,
     markAsTaken,
     deleteReminder,
     toggleReminder,
     getUpcomingReminders,
   } = useMedicineReminders();
 
   const [showAddDialog, setShowAddDialog] = useState(false);
   const [showEditDialog, setShowEditDialog] = useState(false);
   const [editingReminder, setEditingReminder] = useState<any>(null);
   
   // Form state
   const [medicineName, setMedicineName] = useState("");
   const [dosage, setDosage] = useState("");
   const [frequency, setFrequency] = useState<"daily" | "twice_daily" | "thrice_daily" | "weekly" | "as_needed">("daily");
   const [time1, setTime1] = useState("08:00");
   const [time2, setTime2] = useState("20:00");
   const [time3, setTime3] = useState("14:00");
   const [instructions, setInstructions] = useState("");
   const [alarmSound, setAlarmSound] = useState(true);
   const [alarmVibrate, setAlarmVibrate] = useState(true);
 
   const resetForm = () => {
     setMedicineName("");
     setDosage("");
     setFrequency("daily");
     setTime1("08:00");
     setTime2("20:00");
     setTime3("14:00");
     setInstructions("");
     setAlarmSound(true);
     setAlarmVibrate(true);
   };
 
   const handleCreateReminder = async () => {
     if (!medicineName.trim()) return;
 
     const timesOfDay = [time1];
     if (frequency === "twice_daily" || frequency === "thrice_daily") {
       timesOfDay.push(time2);
     }
     if (frequency === "thrice_daily") {
       timesOfDay.push(time3);
     }
 
     await createReminder({
       medicineName: medicineName.trim(),
       dosage: dosage.trim() || undefined,
       frequency,
       timesOfDay,
       instructions: instructions.trim() || undefined,
     });
 
     resetForm();
     setShowAddDialog(false);
   };
 
   const handleEdit = (reminder: any) => {
     setEditingReminder(reminder);
     setMedicineName(reminder.medicine_name);
     setDosage(reminder.dosage || "");
     setFrequency(reminder.frequency);
     setTime1(reminder.times_of_day?.[0] || "08:00");
     setTime2(reminder.times_of_day?.[1] || "20:00");
     setTime3(reminder.times_of_day?.[2] || "14:00");
     setInstructions(reminder.instructions || "");
     setShowEditDialog(true);
   };
 
   const handleDeleteReminder = async (id: string) => {
     await deleteReminder(id);
   };
 
   const upcomingReminders = getUpcomingReminders();
   const displayReminders = compact ? upcomingReminders.slice(0, 3) : upcomingReminders;
 
   return (
     <>
       <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-6">
         <div className="mb-3 flex items-center justify-between sm:mb-4">
           <div className="flex items-center gap-2">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
               <Pill className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
             </div>
             <div>
               <h2 className="text-base font-semibold text-foreground sm:text-lg">
                 Medicine Reminders
               </h2>
               <p className="text-xs text-muted-foreground">
                 {reminders.length} active reminder{reminders.length !== 1 ? "s" : ""}
               </p>
             </div>
           </div>
           <Button
             size="sm"
             className="gap-1"
             onClick={() => setShowAddDialog(true)}
           >
             <Plus className="h-4 w-4" />
             <span className="hidden sm:inline">Add</span>
           </Button>
         </div>
 
         {loading ? (
           <div className="flex items-center justify-center py-6">
             <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
           </div>
         ) : displayReminders.length === 0 ? (
           <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
             <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
             <p className="text-sm font-medium text-muted-foreground">No reminders set</p>
             <p className="text-xs text-muted-foreground/70">
               Tap "Add" to create your first medicine reminder
             </p>
           </div>
         ) : (
           <div className="space-y-2">
             <AnimatePresence>
               {displayReminders.map((item, index) => (
                 <motion.div
                   key={`${item.reminder.id}-${item.time}`}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   transition={{ delay: index * 0.05 }}
                   className={`flex items-center justify-between rounded-xl border p-3 ${
                     item.isTaken
                       ? "border-success/30 bg-success/5"
                       : item.isPast
                       ? "border-warning/30 bg-warning/5"
                       : "border-border bg-muted/30"
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                       item.isTaken
                         ? "bg-success/20 text-success"
                         : item.isPast
                         ? "bg-warning/20 text-warning"
                         : "bg-primary/10 text-primary"
                     }`}>
                       {item.isTaken ? (
                         <Check className="h-5 w-5" />
                       ) : (
                         <Pill className="h-5 w-5" />
                       )}
                     </div>
                     <div>
                       <p className="font-medium text-foreground">
                         {item.reminder.medicine_name}
                       </p>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                         <Clock className="h-3 w-3" />
                         <span>{item.time}</span>
                         {item.reminder.dosage && (
                           <>
                             <span>•</span>
                             <span>{item.reminder.dosage}</span>
                           </>
                         )}
                       </div>
                     </div>
                   </div>
 
                   <div className="flex items-center gap-1">
                     {!item.isTaken && (
                       <Button
                         size="sm"
                         variant="ghost"
                         className="h-8 gap-1 text-success hover:bg-success/10 hover:text-success"
                         onClick={() => markAsTaken(item.reminder.id)}
                       >
                         <Check className="h-4 w-4" />
                         <span className="hidden sm:inline">Taken</span>
                       </Button>
                     )}
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-8 w-8">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => handleEdit(item.reminder)}>
                           <Edit2 className="mr-2 h-4 w-4" />
                           Edit
                         </DropdownMenuItem>
                         <DropdownMenuItem
                           className="text-destructive"
                           onClick={() => handleDeleteReminder(item.reminder.id)}
                         >
                           <Trash2 className="mr-2 h-4 w-4" />
                           Delete
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
         )}
 
         {!compact && reminders.length > 0 && (
           <div className="mt-4 rounded-lg bg-muted/30 p-3">
             <h3 className="mb-2 text-sm font-medium text-foreground">All Reminders</h3>
             <div className="space-y-2">
               {reminders.map((reminder) => (
                 <div
                   key={reminder.id}
                   className="flex items-center justify-between rounded-lg border border-border bg-card p-2"
                 >
                   <div className="flex items-center gap-2">
                     <Switch
                       checked={reminder.is_active}
                       onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                     />
                     <div>
                       <p className="text-sm font-medium">{reminder.medicine_name}</p>
                       <p className="text-xs text-muted-foreground">
                         {reminder.times_of_day?.join(", ")}
                       </p>
                     </div>
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 text-destructive hover:bg-destructive/10"
                     onClick={() => handleDeleteReminder(reminder.id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               ))}
             </div>
           </div>
         )}
       </div>
 
       {/* Add Reminder Dialog */}
       <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Pill className="h-5 w-5 text-primary" />
               Add Medicine Reminder
             </DialogTitle>
             <DialogDescription>
               Create an alarm-style reminder that will alert you until acknowledged.
             </DialogDescription>
           </DialogHeader>
 
           <div className="space-y-4">
             <div>
               <Label>Medicine Name *</Label>
               <Input
                 value={medicineName}
                 onChange={(e) => setMedicineName(e.target.value)}
                 placeholder="e.g., Metformin"
               />
             </div>
 
             <div>
               <Label>Dosage</Label>
               <Input
                 value={dosage}
                 onChange={(e) => setDosage(e.target.value)}
                 placeholder="e.g., 500mg, 1 tablet"
               />
             </div>
 
             <div>
               <Label>Frequency</Label>
               <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="daily">Once daily</SelectItem>
                   <SelectItem value="twice_daily">Twice daily</SelectItem>
                   <SelectItem value="thrice_daily">Three times daily</SelectItem>
                   <SelectItem value="weekly">Weekly</SelectItem>
                   <SelectItem value="as_needed">As needed</SelectItem>
                 </SelectContent>
               </Select>
             </div>
 
             <div className="grid gap-3">
               <div>
                 <Label>Time 1</Label>
                 <Input
                   type="time"
                   value={time1}
                   onChange={(e) => setTime1(e.target.value)}
                 />
               </div>
               {(frequency === "twice_daily" || frequency === "thrice_daily") && (
                 <div>
                   <Label>Time 2</Label>
                   <Input
                     type="time"
                     value={time2}
                     onChange={(e) => setTime2(e.target.value)}
                   />
                 </div>
               )}
               {frequency === "thrice_daily" && (
                 <div>
                   <Label>Time 3</Label>
                   <Input
                     type="time"
                     value={time3}
                     onChange={(e) => setTime3(e.target.value)}
                   />
                 </div>
               )}
             </div>
 
             <div>
               <Label>Instructions (optional)</Label>
               <Input
                 value={instructions}
                 onChange={(e) => setInstructions(e.target.value)}
                 placeholder="e.g., Take with food"
               />
             </div>
 
             <div className="flex items-center justify-between rounded-lg border border-border p-3">
               <div className="flex items-center gap-2">
                 <Bell className="h-4 w-4 text-primary" />
                 <span className="text-sm">Alarm Sound</span>
               </div>
               <Switch checked={alarmSound} onCheckedChange={setAlarmSound} />
             </div>
 
             <Button className="w-full" onClick={handleCreateReminder}>
               <Bell className="mr-2 h-4 w-4" />
               Create Reminder
             </Button>
           </div>
         </DialogContent>
       </Dialog>
 
       {/* Edit Dialog - similar to add but with existing data */}
       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent className="max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <Edit2 className="h-5 w-5 text-primary" />
               Edit Reminder
             </DialogTitle>
           </DialogHeader>
 
           <div className="space-y-4">
             <div>
               <Label>Medicine Name</Label>
               <Input
                 value={medicineName}
                 onChange={(e) => setMedicineName(e.target.value)}
               />
             </div>
             <div>
               <Label>Dosage</Label>
               <Input
                 value={dosage}
                 onChange={(e) => setDosage(e.target.value)}
               />
             </div>
             <p className="text-xs text-muted-foreground">
               Note: To change times, delete and create a new reminder.
             </p>
             <div className="flex gap-2">
               <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)}>
                 Cancel
               </Button>
               <Button className="flex-1" onClick={() => setShowEditDialog(false)}>
                 Save Changes
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
     </>
   );
 };
 
 export default MedicineRemindersCard;