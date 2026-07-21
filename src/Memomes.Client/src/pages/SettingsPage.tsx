import React, { useState } from 'react';
import { Settings, User, Shield, Bell, CreditCard, LogOut, AlertTriangle } from 'lucide-react';

const settingsSections = [
  {
    id: 'profile', label: 'Profile & Account', icon: User,
    items: [
      { label: 'Display Name', value: 'Sathiya Kumar', type: 'text' },
      { label: 'Email', value: 'sathiya@memomes.cloud', type: 'text' },
      { label: 'Phone (2FA)', value: '+91 98765 43210', type: 'text' },
    ]
  },
  {
    id: 'security', label: 'Security & Privacy', icon: Shield,
    items: [
      { label: 'Zero-Knowledge Mode', value: 'ENABLED', type: 'badge-green' },
      { label: 'AES-256-GCM Encryption', value: 'ACTIVE', type: 'badge-green' },
      { label: '2FA Authentication', value: 'ENABLED', type: 'badge-green' },
      { label: 'Shamir Social Recovery', value: '3-of-2 CONFIGURED', type: 'badge-gold' },
    ]
  },
  {
    id: 'notifications', label: 'Notifications', icon: Bell,
    items: [
      { label: 'File Access Alerts', value: 'ON', type: 'toggle' },
      { label: 'Share Link Notifications', value: 'ON', type: 'toggle' },
      { label: 'Cold Storage Warnings', value: 'OFF', type: 'toggle' },
    ]
  },
  {
    id: 'billing', label: 'Plan & Billing', icon: CreditCard,
    items: [
      { label: 'Current Plan', value: 'Pro Solo (₹149/mo)', type: 'badge-gold' },
      { label: 'Storage Quota', value: '100 GB', type: 'text' },
      { label: 'Next Billing Date', value: '2026-08-21', type: 'text' },
      { label: 'Payment Method', value: 'UPI AutoPay (Razorpay)', type: 'text' },
    ]
  },
];

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const active = settingsSections.find(s => s.id === activeTab);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
        <Settings className="w-5 h-5 text-accent-gold" /> Settings & Preferences
      </h2>

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-52 shrink-0 space-y-1">
          {settingsSections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition text-left ${
                  activeTab === section.id
                    ? 'bg-primary/20 text-accent-gold border border-primary/40'
                    : 'text-gray-400 hover:text-white hover:bg-surface-card'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {section.label}
              </button>
            );
          })}

          <div className="pt-4 border-t border-stroke-default space-y-1">
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-orange-400 hover:bg-orange-950/20 transition text-left">
              <AlertTriangle className="w-3.5 h-3.5" /> DPDP Account Purge
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/20 transition text-left">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Settings Content */}
        {active && (
          <div className="flex-1 glass-card rounded-2xl border border-stroke-default p-6 space-y-4">
            <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
              <active.icon className="w-4 h-4 text-accent-gold" />
              {active.label}
            </h3>

            <div className="space-y-3">
              {active.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-stroke-default">
                  <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                  <div>
                    {item.type === 'badge-green' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 rounded-full">{item.value}</span>
                    )}
                    {item.type === 'badge-gold' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-amber-950/60 text-accent-gold border border-amber-500/30 rounded-full">{item.value}</span>
                    )}
                    {item.type === 'text' && (
                      <span className="text-xs text-gray-200 font-mono">{item.value}</span>
                    )}
                    {item.type === 'toggle' && (
                      <button className={`relative w-10 h-5 rounded-full transition ${
                        item.value === 'ON' ? 'bg-primary' : 'bg-surface-card'
                      } border border-stroke-default`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          item.value === 'ON' ? 'left-5' : 'left-0.5'
                        }`} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
