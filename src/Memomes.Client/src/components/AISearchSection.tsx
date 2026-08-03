import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Mic, 
  Paperclip, 
  ArrowRight, 
  FileText, 
  X,
  Filter,
  Calendar,
  HardDrive,
  ShieldCheck,
  RotateCcw
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

  // Search Filter Options
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('any');
  const [selectedSizeFilter, setSelectedSizeFilter] = useState<string>('any');
  const [selectedSecurityFilter, setSelectedSecurityFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

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

  const resetFilters = () => {
    setSelectedFileType('all');
    setSelectedDateFilter('any');
    setSelectedSizeFilter('any');
    setSelectedSecurityFilter('all');
    setQuery('');
    setSearchResults(null);
    if (onSearchQuery) onSearchQuery('');
  };

  const executeSearch = (searchVal: string) => {
    if (!searchVal.trim() && selectedFileType === 'all' && selectedDateFilter === 'any') {
      setSearchResults(null);
      return;
    }
    if (onSearchQuery) onSearchQuery(searchVal);
    
    // Simulate AI Semantic Search Matches with Filter Constraints
    setSearchResults([
      {
        id: 'file-101',
        name: 'Passport_Scan_Official.pdf',
        type: 'PDF',
        relevance: '99% Match',
        snippet: 'Detected valid passport document matching zero-knowledge index for user identity verification.',
        date: '2025-11-14',
        size: '1.4 MB',
        shared: false
      },
      {
        id: 'file-102',
        name: 'Tax_Return_Form_1040_2025.pdf',
        type: 'PDF',
        relevance: '95% Match',
        snippet: 'Contains tax filing data for fiscal year 2025. Protected with AES-256-GCM.',
        date: '2026-01-20',
        size: '3.2 MB',
        shared: true
      }
    ]);
  };

  return (
    <div className="space-y-4">
      {/* Main AI Search Box */}
      <div className="relative rounded-3xl bg-[#0F172A]/90 border border-white/10 p-4 md:p-6 shadow-2xl ai-hero-box transition-all space-y-4 font-sans text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#F5C027]">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Memomes AI Semantic Intelligence
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold border flex items-center gap-1.5 transition ${
                showAdvancedFilters || selectedFileType !== 'all' || selectedDateFilter !== 'any'
                  ? 'bg-[#F5C027]/15 text-[#F5C027] border-[#F5C027]/30'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Search Options</span>
            </button>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Zero-Knowledge Index
            </span>
          </div>
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); executeSearch(query); }}
          className="relative flex items-center w-full"
        >
          <Search className="absolute left-4 w-5 h-5 text-[#F5C027]" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value === '') setSearchResults(null);
            }}
            placeholder="Ask AI anything about your files... (e.g., 'Find my passport', 'Show tax returns')"
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-[#070B14] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F5C027] focus:ring-1 focus:ring-[#F5C027] transition-all"
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
              className="p-2 rounded-xl bg-slate-800/80 border border-white/10 text-slate-400 hover:text-[#F5C027] transition-all"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#F5C027] text-slate-950 font-bold hover:brightness-110 transition-all shadow-md"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Expandable Search Options & Filters Bar */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px] animate-in fade-in duration-200">
            {/* File Type Filter */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <FileText className="w-3 h-3 text-[#F5C027]" /> File Type
              </label>
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-[#F5C027]"
              >
                <option value="all">All File Types</option>
                <option value="documents">Documents (.pdf, .docx, .txt)</option>
                <option value="images">Images (.png, .jpg, .webp)</option>
                <option value="videos">Videos (.mp4, .mov, .mkv)</option>
                <option value="audio">Audio (.mp3, .wav, .flac)</option>
                <option value="spreadsheets">Spreadsheets (.xlsx, .csv)</option>
                <option value="presentations">Presentations (.pptx)</option>
                <option value="source-code">Source Code (.ts, .cs, .py)</option>
                <option value="archives">Archives (.zip, .rar, .7z)</option>
              </select>
            </div>

            {/* Date Modified Filter */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-cyan-400" /> Date Modified
              </label>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="any">Any Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="year">Past Year (2025-2026)</option>
              </select>
            </div>

            {/* File Size Filter */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-purple-400" /> File Size
              </label>
              <select
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-purple-400"
              >
                <option value="any">Any Size</option>
                <option value="small">Small (&lt; 1 MB)</option>
                <option value="medium">Medium (1 MB - 50 MB)</option>
                <option value="large">Large (50 MB - 500 MB)</option>
                <option value="enterprise">Huge (&gt; 500 MB)</option>
              </select>
            </div>

            {/* Security Tier Filter */}
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Security Scope
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedSecurityFilter}
                  onChange={(e) => setSelectedSecurityFilter(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="all">All Tiers</option>
                  <option value="aes-256">AES-256 Zero-Knowledge</option>
                  <option value="shared">Shared Vault Links</option>
                </select>

                <button
                  onClick={resetFilters}
                  className="h-9 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition flex items-center gap-1 shrink-0"
                  title="Reset Search Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-slate-500 font-medium shrink-0">Try:</span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(item.query)}
              className="px-3 py-1 rounded-full bg-slate-800/80 border border-white/10 text-xs text-slate-300 hover:text-white hover:border-amber-500/40 transition-all shrink-0 flex items-center gap-1.5 hover:bg-slate-800"
            >
              <Sparkles className="w-3 h-3 text-[#F5C027]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* AI Search Results Overlay / Card */}
      {searchResults && (
        <div className="rounded-3xl bg-[#0F172A] border border-amber-500/30 p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 font-sans">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5C027]" />
              <h3 className="text-sm font-bold text-white">AI Search Results</h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[#F5C027] text-xs font-mono">
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
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#F5C027]">
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

                <div className="flex items-center gap-2 font-mono">
                  <span className="text-[11px] text-slate-500">{res.size} • {res.date}</span>
                  <button 
                    onClick={onOpenAIIntelligence}
                    className="px-3 py-1.5 rounded-xl bg-[#F5C027]/10 border border-[#F5C027]/30 text-[#F5C027] text-xs font-semibold hover:bg-[#F5C027] hover:text-slate-950 transition-all"
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
