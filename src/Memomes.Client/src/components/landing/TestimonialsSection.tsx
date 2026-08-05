import React from 'react';
import { Star, ShieldCheck, Quote } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Dr. Marcus Vance',
      role: 'Chief Information Security Officer',
      company: 'Vance CyberTech',
      quote: 'Memomes Cloud is the only storage platform where we maintain 100% cryptographic sovereignty over shared litigation documents even after sending access links to external auditors.',
      rating: 5
    },
    {
      name: 'Elena Rostova',
      role: 'Head of Data Compliance',
      company: 'FinSec Global',
      quote: 'The remote self-destruct feature and instant RAM key buffer purge solved our compliance headache for sharing sensitive financial audit reports with third-party partners.',
      rating: 5
    },
    {
      name: 'Sarah Chen',
      role: 'Lead Security Engineer',
      company: 'Quantum Health',
      quote: 'Client-side AES-256-GCM encryption means our patient MRI scans and medical records never leave local hardware unencrypted. Incredible performance and security.',
      rating: 5
    }
  ];

  return (
    <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Customer Testimonials</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Trusted By Security Leaders Worldwide
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          See why CISOs, compliance officers, and privacy engineers rely on Memomes Cloud.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.map((r, idx) => (
          <div
            key={idx}
            className="p-7 rounded-3xl bg-[#0F172A] border border-white/10 hover:border-amber-400/40 transition-all duration-300 group hover:scale-[1.02] shadow-xl flex flex-col justify-between space-y-6 text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(r.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-slate-600" />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed italic font-sans">
                "{r.quote}"
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white font-mono">{r.name}</h4>
                <p className="text-[10px] text-slate-400 font-mono">{r.role} · {r.company}</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                Verified
              </span>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
