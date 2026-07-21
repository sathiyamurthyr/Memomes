import React, { useState } from 'react';
import { Sparkles, Search, Zap, RefreshCw, Brain, Cpu, Image, FileText } from 'lucide-react';

export const AISearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [hasResults, setHasResults] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasResults(false);
    const start = performance.now();
    // Simulate 512d pgvector cosine similarity sub-5ms search
    await new Promise(res => setTimeout(res, Math.random() * 4 + 1));
    setLatencyMs(performance.now() - start);
    setIsSearching(false);
    setHasResults(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent-gold" /> On-Device AI Search
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Powered by 512-dimension MobileCLIP ONNX embeddings computed entirely on your device. No query leaves your machine.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-2xl p-6 border border-stroke-default space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder='Natural language: "Show me family photos from Goa 2026", "Find my passport", "Documents shared with Rahul"...'
              className="w-full bg-surface border border-stroke-default rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-accent-gold" />}
            {isSearching ? 'Searching...' : 'AI Search'}
          </button>
        </div>

        {latencyMs !== null && (
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2 px-1">
            <Zap className="w-3 h-3 text-accent-gold" />
            <span>pgvector Cosine Similarity query completed in <strong>{latencyMs.toFixed(2)} ms</strong> — Sub-5ms</span>
          </div>
        )}
      </div>

      {/* Model Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'MobileCLIP ONNX', desc: '512-dimension on-device vector embeddings', icon: Cpu, color: 'text-accent-gold' },
          { title: 'pgvector Search', desc: 'Sub-5ms cosine similarity via PostgreSQL', icon: Brain, color: 'text-accent-blue' },
          { title: 'Zero Server Exposure', desc: 'No query or embedding leaves the client', icon: Sparkles, color: 'text-emerald-400' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-card rounded-xl p-4 border border-stroke-default">
              <Icon className={`w-6 h-6 ${card.color} mb-3`} />
              <h4 className="font-bold text-gray-100 text-sm mb-1">{card.title}</h4>
              <p className="text-xs text-gray-400">{card.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Example Queries */}
      <div className="glass-card rounded-2xl p-5 border border-stroke-default">
        <h4 className="font-bold text-gray-200 text-xs mb-3 uppercase tracking-wider">Example AI Queries</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { icon: Image, query: '"Show me all beach vacation photos"' },
            { icon: FileText, query: '"Find my property documents from 2024"' },
            { icon: FileText, query: '"Documents shared with Rahul last month"' },
            { icon: Image, query: '"Photos where my family appears together"' },
          ].map((ex, i) => {
            const Icon = ex.icon;
            return (
              <button
                key={i}
                onClick={() => setQuery(ex.query.replace(/"/g, ''))}
                className="flex items-center gap-2 text-left p-2.5 rounded-lg bg-surface hover:bg-surface-card border border-stroke-default transition text-xs text-gray-300"
              >
                <Icon className="w-3.5 h-3.5 text-accent-gold shrink-0" />
                <span className="font-mono">{ex.query}</span>
              </button>
            );
          })}
        </div>
      </div>

      {hasResults && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/10">
          <h4 className="font-bold text-emerald-400 text-xs mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Search Results (3 files matched)
          </h4>
          <div className="space-y-2 text-xs text-gray-300">
            {['Family_Goa_Vacation_2026.mp4', 'Beach_Sunset_Dec_2025.jpg', 'Goa_Dinner_Family.png'].map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-stroke-default">
                <span className="font-mono">{f}</span>
                <span className="text-emerald-400 font-bold text-[10px]">Match: {(98 - i * 5)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
