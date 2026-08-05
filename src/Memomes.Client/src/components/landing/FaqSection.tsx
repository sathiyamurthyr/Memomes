import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What makes Memomes Cloud zero-knowledge?',
      a: 'Your master password derives 256-bit cryptographic keys locally in browser WebAssembly / Web Crypto. Zero unencrypted file bytes or plaintext keys are ever transmitted or stored on cloud servers.'
    },
    {
      q: 'How does Remote Revocation work after sharing a link?',
      a: 'When you click "Revoke Link", Memomes immediately destroys the RAM key buffers and marks the share authorization as purged in local and cloud indices. Future fetch requests return access denied.'
    },
    {
      q: 'Can Memomes Cloud operators read my files or respond to subpoenas for data?',
      a: 'No. Server operators hold ONLY AES-256 encrypted .enc object payloads. Without your local master password, the encrypted blobs are mathematically indistinguishable from random noise.'
    },
    {
      q: 'How does AI Semantic Search work over encrypted files?',
      a: 'Text extraction and vector embeddings occur locally on client hardware during intake. Encrypted vector representations allow semantic search queries without exposing raw file content.'
    },
    {
      q: 'What happens if I lose my master password?',
      a: 'We offer optional Shamir Secret Key Recovery (3-of-2 social key sharding) where trusted recovery contacts hold encrypted key shards to help restore access without central server intervention.'
    }
  ];

  return (
    <section id="faq" className="relative z-10 py-20 px-6 max-w-4xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-mono font-bold uppercase">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Got Questions? We Have Answers.
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Everything you need to know about zero-knowledge encryption, sharing, and security.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isOpen
                  ? 'bg-[#0F172A] border-amber-500/40 shadow-xl'
                  : 'bg-[#0F172A]/70 border-white/10 hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <span className="text-sm font-bold text-white font-mono">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed font-sans border-t border-white/5 pt-3 animate-in fade-in duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
};
