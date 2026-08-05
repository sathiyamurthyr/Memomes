import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AiSearchSectionDemo: React.FC = () => {
  const [searchPrompt, setSearchPrompt] = useState('Find Passport');

  const presetQueries = [
    { label: 'Find Passport', query: 'Find Passport', match: 'Passport_Scan_Official.pdf', score: '99% Match', type: 'PDF' },
    { label: 'Find Tax Files', query: 'Find Tax Files', match: 'Tax_Return_Form_1040_2025.pdf', score: '97% Match', type: 'PDF' },
    { label: 'Find Photos', query: 'Find Photos', match: 'Family_Vacation_2026.png', score: '95% Match', type: 'Images' },
    { label: 'Find PPT', query: 'Find PPT', match: 'Executive_Presentation_Q3.pptx', score: '96% Match', type: 'Presentations' },
    { label: 'Find Audio', query: 'Find Audio', match: 'Voice_Memo_Meeting_Notes.mp3', score: '94% Match', type: 'Audio' },
    { label: 'Find Videos', query: 'Find Videos', match: 'Keynote_Product_Launch.mp4', score: '98% Match', type: 'Videos' }
  ];

  const currentActiveMatch = presetQueries.find(q => q.query.toLowerCase() === searchPrompt.toLowerCase()) || presetQueries[0];

  return (
    <section id="ai-search" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F5B700]" />
          <span>Privacy-Preserving AI 2.0 Engine</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          AI Semantic Search Over Encrypted Payloads
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Locally query files by natural meaning without leaking unencrypted text to public AI servers.
        </p>
      </div>

      {/* AI Search Interactive Box */}
      <div className="max-w-3xl mx-auto rounded-3xl bg-[#0F172A] border border-white/15 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Preset Query Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {presetQueries.map(pq => (
            <button
              key={pq.label}
              onClick={() => setSearchPrompt(pq.query)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer ${
                searchPrompt.toLowerCase() === pq.query.toLowerCase()
                  ? 'bg-[#F5B700] text-slate-950 shadow-md'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {pq.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center w-full h-12 px-4 rounded-2xl bg-[#070B14] border border-amber-500/40 font-mono text-sm text-white shadow-inner">
          <Search className="w-5 h-5 text-[#F5B700] mr-3 shrink-0" />
          <input
            type="text"
            value={searchPrompt}
            onChange={e => setSearchPrompt(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-white placeholder-slate-500 font-mono"
            placeholder="Type natural query..."
          />
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-[#F5B700] text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 text-[#F5B700]" /> AI Active
          </span>
        </div>

        {/* Simulated Result */}
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{currentActiveMatch.match}</div>
              <div className="text-slate-400 text-[11px]">Category: {currentActiveMatch.type}</div>
            </div>
          </div>

          <div className="text-right">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs">
              {currentActiveMatch.score}
            </span>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Vector Match
            </div>
          </div>
        </div>

      </div>

    </section>
  );
};
