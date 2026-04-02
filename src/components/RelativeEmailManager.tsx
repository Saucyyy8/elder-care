import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronUp, MessageCircle, Plus, Send, X } from "lucide-react";
import { ASSISTANT_ACTION_EVENT, type AssistantAction } from "@/lib/assistantActions";

interface Contact {
  id: string;
  name: string;
  chatId: string;
  relation: string;
  avatar?: string;
}

interface RelativeEmailManagerProps {
  onContactsChange?: (contacts: Array<{ name: string; relation: string }>) => void;
}

const CONTACTS_STORAGE_KEY = "guardianFamilyContacts";

const RelativeEmailManager = ({ onContactsChange }: RelativeEmailManagerProps) => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Pallab", chatId: "8507257605", relation: "Family" },
    { id: "2", name: "Vamsi", chatId: "6607547411", relation: "Family" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as Contact[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setContacts(parsed);
      }
    } catch (error) {
      console.error("Failed to parse saved family contacts", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
    onContactsChange?.(contacts.map((contact) => ({ name: contact.name, relation: contact.relation })));
  }, [contacts, onContactsChange]);

  const addContact = () => {
    if (!newName || !newChatId) return;
    setContacts((prev) => [
      ...prev,
      { id: Date.now().toString(), name: newName, chatId: newChatId, relation: newRelation || "Family" },
    ]);
    setNewName("");
    setNewChatId("");
    setNewRelation("");
    setShowAdd(false);
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const visibleContacts = expanded ? contacts : contacts.slice(0, 2);

  const sendUpdate = async (overrideMessage?: string) => {
    setSending(true);
    
    try {
      const message =
        overrideMessage ||
        "🌟 Daily Update: Today has been a good day! All medications taken and checklist completed.";
      const botToken = "8367204813:AAFhSRWxBC9VYDDGj_2YrbKl_84SFry30vg";
      
      const promises = contacts.map(contact => 
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: contact.chatId,
            text: message,
          }),
        })
      );
      
      await Promise.all(promises);
      alert(`✉️ Daily update sent to ${contacts.length} family members via Telegram!`);
    } catch (error) {
      console.error("Failed to send updates:", error);
      alert("⚠️ Failed to send some updates. Please try again.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const onAssistantAction = (event: Event) => {
      const custom = event as CustomEvent<AssistantAction>;
      const action = custom.detail;

      if (action?.type === "send_family_update") {
        void sendUpdate(action.message);
      }
    };

    window.addEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
    return () => window.removeEventListener(ASSISTANT_ACTION_EVENT, onAssistantAction);
  }, [contacts]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-heading font-semibold text-slate-100">
          <MessageCircle className="h-5 w-5 text-cyan-200" />
          Family Updates
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/25 text-cyan-100 transition hover:scale-105"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-xl border border-white/15 bg-slate-800 p-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <input
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="Telegram Chat ID"
              className="w-full rounded-xl border border-white/15 bg-slate-800 p-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <input
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              placeholder="Relation (e.g., Son)"
              className="w-full rounded-xl border border-white/15 bg-slate-800 p-3 text-base text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/40"
            />
            <button
              onClick={addContact}
              className="w-full rounded-xl bg-cyan-500 py-3 text-base font-semibold text-white transition hover:bg-cyan-400"
            >
              Add Contact
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {visibleContacts.map((contact) => (
          <motion.div
            key={contact.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-3"
          >
            <div className="relative">
              {contact.avatar ? (
                <img src={contact.avatar} alt={contact.name} className="h-11 w-11 rounded-xl object-cover" />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-sm font-semibold text-cyan-100">
                  {contact.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <CheckCircle2 className="absolute -bottom-1 -right-1 h-4 w-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-base font-medium text-slate-100">{contact.name}</p>
              <p className="truncate text-sm text-slate-400">{contact.relation} · last update confirmed</p>
            </div>
            <button
              onClick={() => removeContact(contact.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-red-500/20"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </motion.div>
        ))}
      </div>

      {contacts.length > 2 && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="inline-flex min-h-[40px] items-center gap-2 text-sm text-slate-300 transition hover:text-slate-100"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? "Show fewer contacts" : "Expand contact list"}
        </button>
      )}

      <button
        onClick={sendUpdate}
        disabled={sending || contacts.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 p-4 text-lg font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
        {sending ? "Sending..." : "Send Update"}
      </button>
    </div>
  );
};

export default RelativeEmailManager;
