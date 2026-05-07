import { useState, useEffect } from "react";
import { 
  useListTodayReminders, 
  getListTodayRemindersQueryKey, 
  useMarkReminderTaken, 
  useDeleteReminder,
  getListRemindersQueryKey,
  getGetReminderSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function RemindersList() {
  const { data: reminders, isLoading } = useListTodayReminders();
  const [notifiedIds, setNotifiedIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const markTaken = useMarkReminderTaken({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTodayRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReminderSummaryQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Error updating reminder",
          description: (err.data as { error?: string })?.error || err.message || "Could not update status.",
          variant: "destructive"
        });
      }
    }
  });

  const deleteReminder = useDeleteReminder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTodayRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReminderSummaryQueryKey() });
        toast({
          title: "Reminder deleted",
          description: "The medicine reminder has been removed."
        });
      },
      onError: (err) => {
        toast({
          title: "Error deleting reminder",
          description: (err.data as { error?: string })?.error || err.message || "Could not delete reminder.",
          variant: "destructive"
        });
      }
    }
  });

  // Browser notifications
  useEffect(() => {
    if (!reminders || !("Notification" in window)) return;
    
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      reminders.forEach(reminder => {
        if (!reminder.taken && reminder.time === currentTime && !notifiedIds.includes(reminder.id)) {
          if (Notification.permission === "granted") {
            new Notification("Medicine Reminder", {
              body: `It's time to take your ${reminder.medicineName}`,
              icon: "/favicon.svg"
            });
          } else {
            window.alert(`Time to take ${reminder.medicineName}`);
          }
          setNotifiedIds((ids) => [...ids, reminder.id]);
        }
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [reminders, notifiedIds]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-secondary rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!reminders || reminders.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed rounded-3xl bg-card/50">
        <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-2">No reminders yet</h3>
        <p className="text-muted-foreground">Add your daily medicines to get started.</p>
      </Card>
    );
  }

  const sortedReminders = [...reminders].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-4" data-testid="list-reminders">
      {sortedReminders.map(reminder => {
        const isPast = reminder.time < new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) && !reminder.taken;
        
        return (
          <Card 
            key={reminder.id} 
            className={`p-4 rounded-3xl transition-all duration-300 border-2 flex items-center gap-4 group ${
              reminder.taken ? 'opacity-60 bg-secondary/30 border-transparent' : 
              isPast ? 'border-destructive/30 bg-destructive/5' : 
              'border-transparent shadow-sm hover:shadow-md'
            }`}
            data-testid={`card-reminder-${reminder.id}`}
          >
            <button
              onClick={() => markTaken.mutate({ id: reminder.id, data: { taken: !reminder.taken } })}
              disabled={markTaken.isPending}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                reminder.taken ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary'
              }`}
              data-testid={`button-toggle-taken-${reminder.id}`}
              aria-label={reminder.taken ? "Mark as not taken" : "Mark as taken"}
            >
              <Check className={`w-6 h-6 transition-transform ${reminder.taken ? 'scale-100' : 'scale-75 opacity-50'}`} />
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold text-lg truncate ${reminder.taken ? 'line-through text-muted-foreground' : ''}`}>
                  {reminder.medicineName}
                </h4>
                {isPast && !reminder.taken && (
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {reminder.time}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full flex-shrink-0"
              onClick={() => deleteReminder.mutate({ id: reminder.id })}
              disabled={deleteReminder.isPending}
              data-testid={`button-delete-reminder-${reminder.id}`}
              aria-label="Delete reminder"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
