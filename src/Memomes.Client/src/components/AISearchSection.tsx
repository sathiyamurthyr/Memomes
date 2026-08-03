import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Mic, 
  Paperclip, 
  ArrowRight, 
  FileText, 
  X 
} from 'lucide-react';

interface AISearchSectionProps {
  onSearchQuery?: (query: string) => void;
  onOpenAIIntelligence?: () => void;
}

export const AISearchSection: React.FC<AISearchSectionProps> = ({
  onSearchQuery,
  onOpenAIIntelligence
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  const promptSuggestions = [
    { label: 'Find passport', query: 'Find passport document' },
    { label: 'Show invoices', query: 'Show recent monthly invoices' },
    { label: 'Search tax files', query: 'Search tax returns and 2025 filings' },
    { label: 'Show shared PDFs', query: 'List all shared PDF files with download protection' },
    { label: 'Find images from 2025', query: 'Find images created in 2025' }
  ];

  const handlePromptClick = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    executeSearch(suggestedQuery);
  };

  const handleVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setQuery('Show tax files from 2025');
      executeSearch('Show tax files from 2025');
    }, 2000);
  };

  const executeSearch = (searchVal: string) => {
    if (!searchVal.trim()) {
      setSearchResults(null);
      return;
    }
    if (onSearchQuery) onSearchQuery(searchVal);
    
    // Simulate AI Semantic Search Matches
    setSearchResults([
      {
        id: 'file-101',
        name: 'Passport_Scan_Official.pdf',
        type: 'PDF',
        relevance: '99% Match',
        snippet: 'Detected valid passport document matching zero-knowledge index for user identity verification.',
        date: '2025-11-14',
        shared: false
      },
      {
        id: 'file-102',
        name: 'Tax_Return_Form_1040_2025.pdf',
        type: 'PDF',
        relevance: '95% Match',
        snippet: 'Contains tax filing data for fiscal year 2025. Protected with AES-256-GCM.',
        date: '2026-01-20',
        shared: true
      }
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Main AI Search Box */}
      <div className="relative rounded-3xl bg-[#0F172A]/90 border border-white/10 p-4 md:p-6 shadow-2xl ai-hero-box transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#F5B700]">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Memomes AI Semantic Intelligence
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Zero-Knowledge Encrypted Indexing
          </span>
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); executeSearch(query); }}
          className="relative flex items-center w-full"
        >
          <Search className="absolute left-4 w-5 h-5 text-[#F5B700]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === '') setSearchResults(null);
            }}
            placeholder="Ask AI anything about your files... (e.g., 'Find my passport', 'Show tax returns')"
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-[#070B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F5B700] focus:ring-1 focus:ring-[#F5B700] transition-all"
          />

          <div className="absolute right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Search"
              className={`p-2 rounded-xl border text-xs transition-all ${
                isListening 
                  ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                  : 'bg-slate-800/80 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenAIIntelligence}
              title="Deep AI Conversation"
              className="p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-[#F5B700] transition-all"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#F5B700] text-slate-950 font-bold hover:brightness-110 transition-all shadow-md"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Suggested Prompts */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Try:</span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(item.query)}
              className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-amber-500/40 transition-all shrink-0 flex items-center gap-1.5 hover:bg-slate-800"
            >
              <Sparkles className="w-3 h-3 text-[#F5B700]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Search Results Overlay / Card */}
      {searchResults && (
        <div className="rounded-3xl bg-[#0F172A] border border-amber-500/30 p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5B700]" />
              <h3 className="text-sm font-bold text-white">AI Search Results</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[#F5B700] text-xs font-mono">
                {searchResults.length} Matches Found
              </span>
            </div>
            <button 
              onClick={() => setSearchResults(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2.5">
            {searchResults.map((res) => (
              <div 
                key={res.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-amber-500/30 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#F5B700]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{res.name}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-mono">
                        {res.relevance}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {res.snippet}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-mono">{res.date}</span>
                  <button 
                    onClick={onOpenAIIntelligence}
                    className="px-3 py-1.5 rounded-xl bg-[#F5B700]/10 border border-[#F5B700]/30 text-[#F5B700] text-xs font-semibold hover:bg-[#F5B700] hover:text-slate-950 transition-all"
                  >
                    View File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
