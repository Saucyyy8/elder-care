import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircleHeart, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "ai" | "user";
}

const GEMINI_API_KEY = "AIzaSyDv61fq1EDqyhuq7yAJqH2XsvnN2RXlD2k";

const generateGeminiResponse = async (chatHistory: Message[], currentInput: string) => {
  try {
    const contents = chatHistory.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));
    
    contents.push({
      role: "user",
      parts: [{ text: currentInput }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
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

const CompanionChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Good afternoon! How are you feeling today? 😊", sender: "ai" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    const aiText = await generateGeminiResponse(messages, currentInput);
    
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: aiText,
      sender: "ai",
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
        <MessageCircleHeart className="w-5 h-5 text-success" />
        AI Companion
      </h2>

      <div className="flex-1 space-y-2 overflow-y-auto max-h-[280px] pr-1">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-3 rounded-2xl max-w-[85%] text-base font-body ${
              msg.sender === "ai"
                ? "bg-accent text-accent-foreground rounded-tl-sm"
                : "bg-primary text-primary-foreground rounded-tr-sm ml-auto"
            }`}
          >
            {msg.text}
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-xl bg-card border border-border text-foreground font-body text-base focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={sendMessage}
          className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Send className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default CompanionChat;
