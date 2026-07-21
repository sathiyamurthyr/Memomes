import React, { useState } from 'react';
import { Check, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';

interface PricingModalProps {
  currentTier: string;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ currentTier, onClose }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      tier: 'FREE',
      name: 'Free Vault',
      storage: '5 GB',
      monthlyPrice: 0,
      annualPrice: 0,
      description: 'Zero-Knowledge baseline storage for personal files',
      features: ['5 GB ZK Storage', 'Web & PWA Access', 'Sub-5ms Local Vector Search', 'Standard Security']
    },
    {
      tier: 'PRO_SOLO',
      name: 'Pro Solo',
      storage: '100 GB',
      monthlyPrice: 149,
      annualPrice: 1490,
      popular: true,
      description: 'Ideal for power users with large photos & video streaming',
      features: ['100 GB ZK Storage', 'Large Video Zero-RAM Stream', 'Shamir 3-of-2 Social Recovery', 'Dynamic Anti-Leak Watermark']
    },
    {
      tier: 'PRO_PLUS',
      name: 'Pro Plus',
      storage: '500 GB',
      monthlyPrice: 399,
      annualPrice: 3990,
      description: 'High capacity vault for creator archives & document OCR',
      features: ['500 GB ZK Storage', 'All Pro Solo Features', 'Priority Multi-Threaded Chunking', '24/7 Priority Support']
    },
    {
      tier: 'FAMILY_VAULT',
      name: 'Family Vault',
      storage: '1 TB',
      monthlyPrice: 699,
      annualPrice: 6990,
      description: 'Shared encrypted vault across 5 isolated family member accounts',
      features: ['1 TB Shared ZK Storage', '5 Isolated Member Accounts', 'Family Key Emergency Recovery', 'Dynamic Anti-Leak Watermarks']
    }
  ];

  const handleUPICheckout = (tier: string, price: number) => {
    alert(`Initiating 0% Fee Razorpay UPI AutoPay Mandate for ${tier} at ₹${price}/${billingCycle === 'monthly' ? 'mo' : 'yr'}. NPCI 0% transaction fee applied.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative max-w-5xl w-full bg-surface-container border border-stroke-default rounded-2xl p-6 sm:p-8 my-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent-gold" /> Memomes Cloud Subscriptions
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Zero-Knowledge Privacy Cloud Storage. All billing strictly in Indian Rupees (₹ / INR).
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-lg bg-surface">✕</button>
        </div>

        {/* 0% Fee UPI AutoPay Banner */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 mb-6 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span><strong>NPCI 0% Fee Optimization:</strong> Defaulting to UPI & UPI AutoPay e-mandate eliminates credit card surcharges.</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full text-[11px]">₹0 Payment Gateway Fee</span>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-surface p-1 rounded-xl border border-stroke-default flex items-center">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${billingCycle === 'monthly' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${billingCycle === 'annual' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <span>Annual Billing</span>
              <span className="bg-accent-gold text-surface-container font-extrabold text-[10px] px-1.5 py-0.5 rounded-full">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const isCurrent = currentTier === plan.tier;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;

            return (
              <div
                key={plan.tier}
                className={`relative flex flex-col justify-between p-5 rounded-xl border ${plan.popular ? 'border-accent-gold bg-surface-card shadow-xl shadow-amber-500/10' : 'border-stroke-default bg-surface'} transition hover:border-primary/60`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-gold text-surface-container text-[10px] font-extrabold px-3 py-0.5 rounded-full shadow-md">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-gray-100 text-lg">{plan.name}</h3>
                  <div className="text-2xl font-extrabold text-accent-gold mt-2">
                    {plan.storage}
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <span className="text-3xl font-extrabold text-white">₹{price}</span>
                    <span className="text-xs text-gray-400 ml-1">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 min-h-[36px]">{plan.description}</p>

                  <ul className="mt-4 space-y-2 border-t border-stroke-default pt-4 text-xs text-gray-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="w-3.5 h-3.5 text-accent-gold mr-2 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUPICheckout(plan.tier, price)}
                  disabled={isCurrent}
                  className={`mt-6 w-full py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-stroke-default text-gray-400 cursor-default'
                      : plan.popular
                      ? 'bg-accent-gold hover:bg-amber-400 text-surface-container shadow-lg shadow-amber-500/20'
                      : 'bg-primary hover:bg-primary-hover text-white'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>{isCurrent ? 'Current Plan' : `Pay ₹${price} via UPI AutoPay`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
