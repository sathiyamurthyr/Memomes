import React from 'react';
import { Wifi, Bluetooth, Radio, ShieldCheck, Zap, Users } from 'lucide-react';

export const NearbySharePage: React.FC = () => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [peers] = React.useState([
    { id: 'peer1', name: "Priya's iPhone 15 Pro", distance: '~2m', signal: 94, trusted: true },
    { id: 'peer2', name: "Rahul's MacBook Air M3", distance: '~5m', signal: 78, trusted: false },
  ]);

  const startScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-accent-gold" /> Nearby Offline P2P Share
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          End-to-end encrypted WebRTC transfers over LAN or Bluetooth. Files never touch Memomes servers.
        </p>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'WebRTC', icon: Radio, color: 'text-emerald-400', status: 'Ready' },
          { label: 'Bluetooth', icon: Bluetooth, color: 'text-accent-blue', status: 'Active' },
          { label: 'LAN P2P', icon: Wifi, color: 'text-accent-gold', status: 'Ready' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card rounded-xl p-4 border border-stroke-default text-center">
              <Icon className={`w-6 h-6 ${c.color} mx-auto mb-2`} />
              <div className="text-xs font-bold text-gray-200">{c.label}</div>
              <div className={`text-[11px] font-mono ${c.color} mt-0.5`}>{c.status}</div>
            </div>
          );
        })}
      </div>

      {/* Scan & Device List */}
      <div className="glass-card rounded-2xl p-6 border border-stroke-default space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-200 text-sm">Nearby Devices</h4>
          <button
            onClick={startScan}
            className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            {isScanning ? (
              <><Radio className="w-3.5 h-3.5 animate-ping" /> Scanning...</>
            ) : (
              <><Wifi className="w-3.5 h-3.5" /> Scan for Devices</>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {peers.map(peer => (
            <div key={peer.id} className="flex items-center justify-between p-3.5 bg-surface rounded-xl border border-stroke-default">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-card border border-stroke-default flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent-blue" />
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-200 block">{peer.name}</span>
                  <span className="text-[11px] text-gray-400 font-mono">{peer.distance} — Signal: {peer.signal}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {peer.trusted && (
                  <span className="text-[10px] font-bold text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full bg-emerald-950/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Trusted
                  </span>
                )}
                <button className="px-3 py-1.5 bg-primary/20 text-accent-gold border border-primary/30 text-xs font-bold rounded-lg hover:bg-primary/30 transition flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Send Files
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
          All transfers encrypted with shared AES-256 session key derived via X25519 Diffie–Hellman handshake.
        </div>
      </div>
    </div>
  );
};
