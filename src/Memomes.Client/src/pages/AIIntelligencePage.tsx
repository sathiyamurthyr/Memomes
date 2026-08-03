import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  Paperclip, 
  Bot, 
  User, 
  FileText, 
  ShieldCheck, 
  Lock
} from 'lucide-react';

export const AIIntelligencePage: React.FC = () => {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hello! I am your Memomes AI Assistant. I operate directly over your zero-knowledge encrypted vault. Ask me to find documents, extract tax details, analyze PDFs, or summarize files.',
      timestamp: '10:00 AM',
      citations: []
    },
    {
      id: 2,
      sender: 'user',
      text: 'Show tax returns and financial audit documents for 2025.',
      timestamp: '10:02 AM',
      citations: []
    },
    {
      id: 3,
      sender: 'ai',
      text: 'I found 2 documents matching your 2025 financial query. Both files are protected with client-side AES-256 encryption:',
      timestamp: '10:02 AM',
      citations: [
        {
          name: 'Tax_Return_Form_1040_2025.pdf',
          snippet: 'Gross income reported: $142,500. Refund status: Processed. Security: Download Disabled.',
          date: 'Jan 20, 2026'
        },
        {
          name: 'Q3_Financial_Audit_2025.pdf',
          snippet: 'Audited balance sheet verified by certified CPA. Watermark overlay enforced.',
          date: 'Nov 14, 2025'
        }
      ]
    }
  ]);

  const handleSendMessage = () => {
    if (!inputQuery.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      citations: []
    };
    setMessages((prev) => [...prev, userMsg]);
    const promptText = inputQuery;
    setInputQuery('');

    // Simulate AI response
    setTimeout(() => {
      const aiReply = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Analysis complete for: "${promptText}". I searched across your encrypted files and extracted key highlights with zero data leakage.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: [
          {
            name: 'Passport_Scan_Official.pdf',
            snippet: 'Zero-knowledge verification confirmed matching identity documents.',
            date: 'Nov 14, 2025'
          }
        ]
      };
      setMessages((prev) => [...prev, aiReply]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto space-y-4 p-2 md:p-4">
      {/* Page Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span>AI File Intelligence</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[#F5B700] text-xs font-mono border border-amber-500/20">
                GPT-4o / Claude 3.5 Hybrid
              </span>
            </h1>
            <p className="text-xs text-slate-400">Ask natural language questions across your encrypted vault documents.</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>Local Client-Side Inference Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-[#F5B700]/20 border border-[#F5B700]/40 text-[#F5B700] flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-2xl space-y-2 ${
              msg.sender === 'user'
                ? 'bg-[#F5B700] text-slate-950 rounded-2xl rounded-tr-xs p-4 shadow-lg font-medium text-sm'
                : 'bg-[#0F172A] border border-white/10 rounded-2xl rounded-tl-xs p-4 shadow-xl text-slate-200 text-sm'
            }`}>
              <p className="leading-relaxed">{msg.text}</p>

              {/* Document Citations Card */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Source Citations:
                  </span>
                  {msg.citations.map((c, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-emerald-400" /> {c.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{c.date}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic">"{c.snippet}"</p>
                    </div>
                  ))}
                </div>
              )}

              <span className={`text-[10px] block text-right font-mono ${
                msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'
              }`}>
                {msg.timestamp}
              </span>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 text-white flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Suggested Input Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
        {['Summarize Tax Returns', 'Extract Passport ID', 'Show shared PDF access logs', 'List confidential contracts'].map((prompt, i) => (
          <button
            key={i}
            onClick={() => { setInputQuery(prompt); }}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-amber-500/40 transition-all shrink-0 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[#F5B700]" />
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Query Bar */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        className="relative flex items-center w-full bg-[#0F172A] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-[#F5B700] transition-colors"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask AI to analyze, search, or summarize your files..."
          className="w-full bg-transparent px-4 text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-[#F5B700] transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="btn-gold !h-9 !px-4 !text-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
