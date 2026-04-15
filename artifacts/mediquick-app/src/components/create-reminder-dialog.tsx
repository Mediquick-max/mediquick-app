import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateReminder, getListRemindersQueryKey, getListTodayRemindersQueryKey, getGetReminderSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, Pill } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  medicineName: z.string().min(1, "Medicine name is required"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format")
});

export function CreateReminderDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicineName: "",
      time: "08:00"
    }
  });

  const createReminder = useCreateReminder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTodayRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReminderSummaryQueryKey() });
        setOpen(false);
        form.reset();
        toast({
          title: "Reminder added",
          description: "Your medicine reminder has been scheduled.",
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to add reminder",
          description: error.error || "An unexpected error occurred.",
          variant: "destructive"
        });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createReminder.mutate({ data: values });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full shadow-sm hover:shadow-md transition-all active:scale-95" size="lg" data-testid="button-add-reminder">
          <Plus className="w-5 h-5 mr-2" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-3xl" data-testid="dialog-create-reminder">
        <DialogHeader>
          <DialogTitle className="text-2xl">New Reminder</DialogTitle>
          <DialogDescription>
            Set a daily schedule for your medicine.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="medicineName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground flex items-center gap-2">
                    <Pill className="w-4 h-4" />
                    Medicine Name
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Vitamin D" 
                      className="h-12 rounded-2xl bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:ring-primary transition-all" 
                      data-testid="input-medicine-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className="h-12 rounded-2xl bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:ring-primary transition-all"
                      data-testid="input-medicine-time"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={createReminder.isPending} 
                className="w-full rounded-2xl h-12 text-base font-medium shadow-md hover:shadow-lg transition-all"
                data-testid="button-submit-reminder"
              >
                {createReminder.isPending ? "Saving..." : "Save Reminder"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
