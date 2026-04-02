import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleHeart, Mic, Send, Volume2 } from "lucide-react";
import { dispatchAssistantAction, type AssistantAction } from "@/lib/assistantActions";

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

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string; message?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_MODEL = "llama-3.1-8b-instant";
const PERSONA_INSTRUCTION =
  "You are the Guardian Companion Assistant. You are supportive, patient, and clear. Your goal is to help Suhas manage his daily routine. You have access to his checklist, family updates, and safety status. Use plain language at grade-6 level and keep responses concise. If the user asks to perform an action, append one line at the end in this exact format: ACTION_JSON: {\"type\":\"...\"}. Allowed action types are toggle_reminder (label), add_reminder (label,time), send_family_update (message), sos_trigger, sos_cancel.";

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

const extractActionFromResponse = (text: string): { cleanText: string; action: AssistantAction | null } => {
  const match = text.match(/ACTION_JSON:\s*(\{[\s\S]*\})\s*$/m);
  if (!match) {
    return { cleanText: text.trim(), action: null };
  }

  try {
    const parsed = JSON.parse(match[1]) as AssistantAction;
    const clean = text.replace(match[0], "").trim();
    return { cleanText: clean || "Done.", action: parsed };
  } catch {
    return { cleanText: text.trim(), action: null };
  }
};

const generateGroqResponse = async (
  chatHistory: Message[],
  currentInput: string,
  context: AssistantContext,
) => {
  try {
    if (!GROQ_API_KEY) {
      return "Assistant key is missing. Set VITE_GROQ_API_KEY in your frontend environment.";
    }

    const hiddenContext = buildHiddenContext(context);

    const messagesPayload = [
      {
        role: "system",
        content: `${PERSONA_INSTRUCTION}\n\n${hiddenContext}`,
      },
      ...chatHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      {
        role: "user",
        content: currentInput,
      },
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.4,
        messages: messagesPayload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || `Groq request failed (${response.status}).`;
      throw new Error(errorMessage);
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      return text;
    }

    return "I'm sorry, I couldn't understand that.";
  } catch (error) {
    console.error("Groq API Error:", error);
    return `I could not reach AI right now. ${error instanceof Error ? error.message : "Please try again."}`;
  }
};

const CompanionChat = ({ context }: CompanionChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hello Suhas. I am here to help with your day. Ask me anything about your schedule or safety status.", sender: "ai" },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const quickActionPrompts = useMemo(() => QUICK_ACTIONS.map((label) => ({ label })), []);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

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
      speakText(concernedMessage.text);
      setIsSending(false);
      return;
    }

    const aiTextRaw = await generateGroqResponse([...messages, userMsg], currentInput, context);
    const { cleanText: aiText, action } = extractActionFromResponse(aiTextRaw);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      sender: "ai",
    };
    setMessages((prev) => [...prev, aiMsg]);
    speakText(aiMsg.text);

    if (action) {
      dispatchAssistantAction(action);
    }

    setIsSending(false);
  };

  const startVoiceInput = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Use Chrome/Edge/Brave on localhost.");
      return;
    }

    setMicError(null);

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        setMicError("Microphone permission denied. Allow mic access in browser site settings.");
        return;
      }
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult?.[0]?.transcript?.trim() || "";
      if (transcript) {
        setInput(transcript);
        void sendMessage(transcript);
      }
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      const errorCode = event?.error || "unknown";
      if (errorCode === "not-allowed") {
        setMicError("Microphone blocked by browser. Please enable mic permission and try again.");
      } else if (errorCode === "no-speech") {
        setMicError("No speech detected. Try speaking clearly and closer to the mic.");
      } else {
        setMicError(`Voice input error: ${errorCode}`);
      }
    };
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
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
          onClick={isListening ? stopVoiceInput : startVoiceInput}
          className={`h-[72px] min-h-[72px] rounded-2xl px-5 flex items-center justify-center transition-colors ${
            isListening ? "bg-amber-500 text-white" : "bg-slate-700 text-cyan-100 hover:bg-slate-600"
          }`}
          title={isListening ? "Stop voice input" : "Start voice input"}
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          onClick={() => setVoiceEnabled((prev) => !prev)}
          className={`h-[72px] min-h-[72px] rounded-2xl px-5 flex items-center justify-center transition-colors ${
            voiceEnabled ? "bg-cyan-700 text-white" : "bg-slate-700 text-slate-200"
          }`}
          title={voiceEnabled ? "Disable voice playback" : "Enable voice playback"}
        >
          <Volume2 className="w-5 h-5" />
        </button>
        <button
          onClick={sendMessage}
          disabled={isSending}
          className="h-[72px] min-h-[72px] rounded-2xl bg-cyan-500 px-6 flex items-center justify-center hover:bg-cyan-400 transition-colors disabled:opacity-60"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {micError && <p className="text-xs text-amber-200">{micError}</p>}
    </div>
  );
};

export default CompanionChat;
