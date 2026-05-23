import React, { useEffect, useState } from 'react';
import { Mail, X, ExternalLink, Trash2 } from 'lucide-react';
import { SimulatedEmail } from '../../server'; // Just for types, won't actually import backend code in real vite build, but for demo:
// Redefining type here for frontend
interface SimEmail {
  id: string;
  template: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string;
}

export default function EmailSimulatorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [emails, setEmails] = useState<SimEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<SimEmail | null>(null);

  const fetchEmails = async () => {
    try {
      const res = await fetch('/agd-budgets/api/emails');
      const data = await res.json();
      if (data.success) {
        // Reverse so newest is first
        setEmails(data.emails.reverse());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
      const interval = setInterval(fetchEmails, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const clearInbox = async () => {
    await fetch('/agd-budgets/api/emails/clear', { method: 'POST' });
    setEmails([]);
    setSelectedEmail(null);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:bg-slate-700 transition-transform hover:scale-105 z-50 flex items-center gap-2"
      >
        <div className="relative">
          <Mail className="w-6 h-6" />
          {emails.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
              {emails.length}
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col" style={{ maxHeight: '600px', height: '80vh' }}>
      
      {/* Header */}
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold">Inbox Simulator</h3>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearInbox} title="Clear Inbox" className="text-slate-400 hover:text-white transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedEmail ? (
          // Email Detail View
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3 border-b border-slate-100 shrink-0">
              <button onClick={() => setSelectedEmail(null)} className="text-xs text-indigo-600 font-bold hover:underline mb-2">
                ← Back to Inbox
              </button>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To: {selectedEmail.to}</div>
              <h4 className="font-bold text-slate-800 text-lg leading-tight">{selectedEmail.subject}</h4>
            </div>
            <div className="p-4 bg-slate-50 flex-1 overflow-y-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm whitespace-pre-wrap text-sm text-slate-700 font-sans">
                {selectedEmail.content}
              </div>
            </div>
          </div>
        ) : (
          // Inbox List View
          <div className="flex-1 overflow-y-auto bg-slate-50">
            {emails.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                <Mail className="w-8 h-8 opacity-50" />
                <p className="text-sm">Inbox is empty.</p>
                <p className="text-xs">Trigger actions in the app to see transactional emails appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {emails.map((email) => (
                  <div 
                    key={email.id} 
                    onClick={() => setSelectedEmail(email)}
                    className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors bg-white group"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-100 px-2 py-0.5 rounded">
                        {email.template}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-700">
                      {email.subject}
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      To: {email.to}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
