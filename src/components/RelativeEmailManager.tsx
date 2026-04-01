import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Plus, X, Send, UserCircle } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  chatId: string;
  relation: string;
}

const RelativeEmailManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "1", name: "Pallab", chatId: "8507257605", relation: "Family" },
    { id: "2", name: "Vamshi", chatId: "6607547411", relation: "Family" },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [sending, setSending] = useState(false);

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

  const sendUpdate = async () => {
    setSending(true);
    
    try {
      const message = "🌟 Daily Update: Today has been a good day! All medications taken and checklist completed.";
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-info" />
          Family Updates (Telegram)
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary p-4 rounded-lg space-y-3"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full p-3 rounded-lg bg-card text-foreground font-body text-base border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              placeholder="Telegram Chat ID"
              className="w-full p-3 rounded-lg bg-card text-foreground font-body text-base border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={newRelation}
              onChange={(e) => setNewRelation(e.target.value)}
              placeholder="Relation (e.g., Son)"
              className="w-full p-3 rounded-lg bg-card text-foreground font-body text-base border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={addContact}
              className="w-full p-3 rounded-lg bg-primary text-primary-foreground font-heading font-bold text-base hover:opacity-90 transition-opacity"
            >
              Add Contact
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 bg-card p-3 rounded-lg"
          >
            <UserCircle className="w-10 h-10 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-body font-medium text-foreground text-base truncate">{contact.name}</p>
              <p className="text-sm text-muted-foreground truncate">{contact.relation} · {contact.chatId}</p>
            </div>
            <button
              onClick={() => removeContact(contact.id)}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-destructive/20 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </div>

      <button
        onClick={sendUpdate}
        disabled={sending || contacts.length === 0}
        className="w-full p-4 rounded-lg bg-info text-info-foreground font-heading font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Send className="w-5 h-5" />
        {sending ? "Sending..." : "Send Daily Update via Telegram"}
      </button>
    </div>
  );
};

export default RelativeEmailManager;
