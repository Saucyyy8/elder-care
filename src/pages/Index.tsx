import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import SOSButton from "@/components/SOSButton";
import DailyChecklist from "@/components/DailyChecklist";
import RelativeEmailManager from "@/components/RelativeEmailManager";
import FallDetectionPanel from "@/components/FallDetectionPanel";
import ActivityMonitor from "@/components/ActivityMonitor";
import CompanionChat from "@/components/CompanionChat";
import VoiceAssistant from "@/components/VoiceAssistant";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-7 h-7 text-sos fill-sos" />
            <h1 className="text-2xl font-heading font-extrabold text-foreground">CareGuard</h1>
          </div>
          <p className="text-sm text-muted-foreground font-body hidden sm:block">
            Always watching over you ❤️
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 pb-24">
        {/* SOS + Status Row */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* SOS */}
          <div className="md:col-span-1 bg-card rounded-2xl p-6 shadow-sm flex items-center justify-center">
            <SOSButton />
          </div>

          {/* Fall Detection */}
          <div className="md:col-span-1 bg-card rounded-2xl p-6 shadow-sm">
            <FallDetectionPanel />
          </div>

          {/* Activity Monitor */}
          <div className="md:col-span-1 bg-card rounded-2xl p-6 shadow-sm">
            <ActivityMonitor />
          </div>
        </motion.section>

        {/* Checklist + Voice */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <DailyChecklist />
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm flex flex-col justify-center">
            <h2 className="text-xl font-heading font-semibold mb-4 text-foreground">Voice Assistant</h2>
            <VoiceAssistant />
          </div>
        </motion.section>

        {/* Email + Chat */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <RelativeEmailManager />
          </div>
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <CompanionChat />
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
