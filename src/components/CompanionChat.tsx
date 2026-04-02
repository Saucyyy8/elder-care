import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleHeart, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "ai" | "user";
}

interface AssistantChecklistItem {
  id: string;
  label: string;
  time: string;
  done: boolean;
}

interface AssistantContext {
  userName: string;
  safetyStatus: "all-good" | "missed-task" | "emergency";
  safetySummary: string;
  checklistProfileName: string;
  checklistItems: AssistantChecklistItem[];
  familyUpdates: string[];
}

interface CompanionChatProps {
  context: AssistantContext;
}

const GEMINI_API_KEY = "AIzaSyCGDi17xxkOTRpz00ApwmKZkJwb0nZkF8E";
const PERSONA_INSTRUCTION =
  "You are the Guardian Companion Assistant. You are supportive, patient, and clear. Your goal is to help Suhas manage his daily routine. You have access to his checklist, family updates, and safety status. Use plain language at grade-6 level and keep responses concise.";

const QUICK_ACTIONS = [
  "Check my schedule",
  "Message Vamshi",
  "I'm feeling dizzy",
] as const;

const buildHiddenContext = (context: AssistantContext) => {
  const nowLabel = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const checklistSummary = context.checklistItems
    .map((item) => {
      const status = item.done ? "DONE" : "PENDING";
      return `[${item.label}: ${status} (Due ${item.time})]`;
    })
    .join(", ");

  const familySummary =
    context.familyUpdates.length > 0 ? context.familyUpdates.join(", ") : "No recent family update requests.";

  return [
    "[SYSTEM CONTEXT]",
    `User: ${context.userName}.`,
    `Time: ${nowLabel}.`,
    `Status: ${context.safetySummary} (${context.safetyStatus}).`,
    `Checklist owner: ${context.checklistProfileName}.`,
    `Checklist: ${checklistSummary || "No tasks yet."}`,
    `Family updates: ${familySummary}`,
  ].join("\n");
};

const generateGeminiResponse = async (
  chatHistory: Message[],
  currentInput: string,
  context: AssistantContext,
) => {
  try {
    const contents = chatHistory.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const hiddenContext = buildHiddenContext(context);

    contents.push({
      role: "user",
      parts: [{ text: `${hiddenContext}\n\n[USER MESSAGE]\n${currentInput}` }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: "system",
          parts: [{ text: PERSONA_INSTRUCTION }],
        },
        contents,
      })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return "I'm sorry, I couldn't understand that.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong. Please try again later.";
  }
};

const CompanionChat = ({ context }: CompanionChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello Suhas. I am here to help with your day. Ask me anything about your schedule or safety status.", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const quickActionPrompts = useMemo(() => QUICK_ACTIONS.map((label) => ({ label })), []);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || isSending) return;

    const userMsg: Message = { id: Date.now().toString(), text: textToSend, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = textToSend;
    setInput("");
    setIsSending(true);

    if (textToSend.toLowerCase().includes("i'm feeling dizzy") || textToSend.toLowerCase().includes("im feeling dizzy")) {
      const concernedMessage: Message = {
        id: `${Date.now()}-concerned`,
        sender: "ai",
        text: "Thanks for telling me, Suhas. Please sit down now, sip water, and press SOS if you feel worse. I can also help you message Vamshi right away.",
      };
      setMessages((prev) => [...prev, concernedMessage]);
      setIsSending(false);
      return;
    }

    const aiText = await generateGeminiResponse(messages, currentInput, context);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      sender: "ai",
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsSending(false);
  };

  return (
    <div className="space-y-4 flex h-full flex-col">
      <h2 className="text-xl font-heading font-bold flex items-center gap-2" style={{ color: "#E0E0E0" }}>
        <MessageCircleHeart className="w-5 h-5 text-cyan-300" />
        Help & Chat Assistant
      </h2>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[90%] rounded-2xl p-4 text-lg font-body leading-relaxed ${
              msg.sender === "ai"
                ? "bg-slate-800 text-[#E0E0E0] rounded-tl-sm border border-slate-600"
                : "bg-blue-700 text-[#F2F4F8] rounded-tr-sm ml-auto border border-blue-400/50"
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickActionPrompts.map((chip) => (
          <button
            key={chip.label}
            onClick={() => sendMessage(chip.label)}
            className="min-h-[60px] rounded-full border border-white/25 bg-slate-800 px-5 py-3 text-base font-semibold text-[#E0E0E0] hover:bg-slate-700"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a question"
          className="h-[72px] flex-1 rounded-2xl border border-slate-500 bg-slate-900 px-5 text-[24px] font-body text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-cyan-300"
        />
        <button
          onClick={sendMessage}
          disabled={isSending}
          className="h-[72px] min-h-[72px] rounded-2xl bg-cyan-500 px-6 flex items-center justify-center hover:bg-cyan-400 transition-colors disabled:opacity-60"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CompanionChat;
