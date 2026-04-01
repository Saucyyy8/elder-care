import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Pill, UtensilsCrossed, Footprints, Droplets, Moon, Heart, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface CheckItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  time: string;
  done: boolean;
}

const initialItems: CheckItem[] = [
  { id: "1", label: "Morning Medicine", icon: <Pill className="w-5 h-5" />, time: "8:00 AM", done: false },
  { id: "2", label: "Breakfast", icon: <UtensilsCrossed className="w-5 h-5" />, time: "9:00 AM", done: false },
  { id: "3", label: "Morning Walk", icon: <Footprints className="w-5 h-5" />, time: "10:00 AM", done: false },
  { id: "4", label: "Drink Water (8 glasses)", icon: <Droplets className="w-5 h-5" />, time: "Throughout day", done: false },
  { id: "5", label: "Afternoon Medicine", icon: <Pill className="w-5 h-5" />, time: "2:00 PM", done: false },
  { id: "6", label: "Blood Pressure Check", icon: <Heart className="w-5 h-5" />, time: "4:00 PM", done: false },
  { id: "7", label: "Evening Medicine", icon: <Pill className="w-5 h-5" />, time: "8:00 PM", done: false },
  { id: "8", label: "Bedtime Routine", icon: <Moon className="w-5 h-5" />, time: "9:30 PM", done: false },
];

const DailyChecklist = () => {
  const [items, setItems] = useState<CheckItem[]>(initialItems);
  const { toast } = useToast();

  const sendDemoReminder = async () => {
    try {
      const telegramToken = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg";
      const chatId = "8507257605";
      const message = "⏰ Reminder: It's time to take your medication!";
      
      const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });
      
      if (response.ok) {
        toast({
          title: "Reminder Sent",
          description: "Medication reminder sent via Telegram.",
        });
      } else {
        toast({
          title: "Failed",
          description: "Could not send reminder.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggle = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = items.filter((i) => i.done).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-foreground">Today's Checklist</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={sendDemoReminder}>
            <Send className="w-4 h-4 mr-2" />
            Demo Reminder
          </Button>
          <span className="text-sm font-body text-muted-foreground">
            {completedCount}/{items.length} done
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-success rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => toggle(item.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all text-left ${
              item.done
                ? "bg-accent/60 opacity-70"
                : "bg-card hover:bg-secondary"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                item.done ? "bg-success" : "bg-secondary"
              }`}
            >
              {item.done ? (
                <Check className="w-4 h-4 text-success-foreground" />
              ) : (
                <span className="text-muted-foreground">{item.icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-body text-base font-medium ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {item.label}
              </p>
              <p className="text-sm text-muted-foreground">{item.time}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;
