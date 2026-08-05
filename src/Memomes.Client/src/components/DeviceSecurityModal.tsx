import React, { useState, useEffect } from 'react';
import {
  Shield, Laptop, LogOut, X, Trash2, CheckCircle2, Lock, Sliders,
  Mail, Key, ShieldCheck
} from 'lucide-react';
import {
  DeviceSecurityEngine,
  type TrustedDeviceRecord,
  type ActiveSessionRecord,
  type AccountSecurityConfig,
  type SecurityNotificationEmail
} from '../utils/deviceSecurityEngine';

interface DeviceSecurityModalProps {
  userEmail?: string;
  onClose: () => void;
}

export const DeviceSecurityModal: React.FC<DeviceSecurityModalProps> = ({
  userEmail = 'sathiya@memomes.com',
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'DEVICES' | 'SESSIONS' | 'CONFIG' | 'EMAILS'>('DEVICES');
  const [trustedDevices, setTrustedDevices] = useState<TrustedDeviceRecord[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSessionRecord[]>([]);
  const [secConfig, setSecConfig] = useState<AccountSecurityConfig>(DeviceSecurityEngine.getSecurityConfig());
  const [emailLogs, setEmailLogs] = useState<SecurityNotificationEmail[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshData = () => {
    setTrustedDevices(DeviceSecurityEngine.getTrustedDevices(userEmail));
    setActiveSessions(DeviceSecurityEngine.getActiveSessions(userEmail));
    setSecConfig(DeviceSecurityEngine.getSecurityConfig());
    setEmailLogs(DeviceSecurityEngine.getSecurityEmailLogs(userEmail));
  };

  useEffect(() => {
    refreshData();

    // Listen for real-time security events
    const handleRevoked = () => refreshData();
    window.addEventListener('memomes_session_revoked', handleRevoked);
    return () => window.removeEventListener('memomes_session_revoked', handleRevoked);
  }, [userEmail]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRevokeDevice = (deviceId: string) => {
    DeviceSecurityEngine.revokeTrustedDevice(userEmail, deviceId);
    showFeedback('Device trust revoked and removed from registry.');
    refreshData();
  };

  const handleRevokeSession = (sessionId: string) => {
    DeviceSecurityEngine.revokeSession(userEmail, sessionId, 'User Initiated Revocation');
    showFeedback('Active session terminated instantly.');
    refreshData();
  };

  const handleSaveConfig = (updates: Partial<AccountSecurityConfig>) => {
    const updated = DeviceSecurityEngine.updateSecurityConfig(updates);
    setSecConfig(updated);
    showFeedback('Security configuration updated successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans text-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0B1120] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5B700]/15 border border-[#F5B700]/30 flex items-center justify-center text-[#F5B700]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Session & Device Security Center
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                  AES-256 Active
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Trusted Registry, Concurrent Session Management & Security Auditing
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> {feedbackMsg}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 font-mono text-xs">
          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
              activeTab === 'DEVICES' ? 'bg-[#F5B700] text-slate-950 shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Laptop className="w-4 h-4" /> Trusted Devices ({trustedDevices.length})
          </button>
          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
              activeTab === 'SESSIONS' ? 'bg-[#F5B700] text-slate-950 shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Key className="w-4 h-4" /> Active Sessions ({activeSessions.length})
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
              activeTab === 'CONFIG' ? 'bg-[#F5B700] text-slate-950 shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Sliders className="w-4 h-4" /> Policy Settings
          </button>
          <button
            onClick={() => setActiveTab('EMAILS')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 font-bold ${
              activeTab === 'EMAILS' ? 'bg-[#F5B700] text-slate-950 shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Mail className="w-4 h-4" /> Email Logs ({emailLogs.length})
          </button>
        </div>

        {/* TAB 1: TRUSTED DEVICES REGISTRY */}
        {activeTab === 'DEVICES' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Trusted Device Fingerprints (Privacy-Preserved SHA-256)</span>
              <span>Require OTP: {secConfig.requireOtpForNewDevices ? 'ENABLED' : 'DISABLED'}</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {trustedDevices.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl border border-white/10 space-y-2">
                  <Laptop className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-white font-bold">No Trusted Devices Registered</div>
                  <p className="text-slate-400 text-xs">New devices will require OTP verification upon sign in.</p>
                </div>
              ) : (
                trustedDevices.map(dev => (
                  <div key={dev.id} className="p-4 rounded-2xl bg-[#050816] border border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Laptop className="w-4 h-4 text-[#F5B700]" />
                        <span>{dev.deviceName}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                          TRUSTED
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        IP: <span className="text-slate-200">{dev.lastIp}</span> ({dev.ipLocation}) • Fingerprint: <span className="text-slate-500">{dev.hashedFingerprint.substring(0, 18)}...</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        First Seen: {new Date(dev.firstSeenAt).toLocaleDateString()} • Last Active: {new Date(dev.lastActiveAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Revoke
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE SESSIONS */}
        {activeTab === 'SESSIONS' && (
          <div className="space-y-3 font-mono">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Concurrent Device Limit: <strong className="text-amber-400">{secConfig.maxActiveSessions} Active Session(s)</strong></span>
              <span className="text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Anti-Session Fixation Active</span>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {activeSessions.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl border border-white/10 space-y-2">
                  <Lock className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-white font-bold">No Active Sessions Found</div>
                </div>
              ) : (
                activeSessions.map(sess => (
                  <div key={sess.id} className="p-4 rounded-2xl bg-[#050816] border border-white/10 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Key className="w-4 h-4 text-[#F5B700]" />
                        <span>{sess.browser} on {sess.os}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                          ACTIVE TOKEN
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        IP: <span className="text-slate-200">{sess.ip}</span> ({sess.location}) • Risk Score: <span className={sess.riskScore > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{sess.riskScore}/100</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Token: <span className="text-slate-400">{sess.sessionToken.substring(0, 20)}...</span> • CSRF Token Active
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeSession(sess.id)}
                      className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log Out
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: POLICY CONFIGURATION */}
        {activeTab === 'CONFIG' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-[#050816] border border-white/10 space-y-4">
              <h4 className="text-xs font-bold text-[#F5B700] uppercase tracking-wider">Account Security Thresholds</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Max Active Devices Limit</label>
                  <select
                    value={secConfig.maxActiveSessions}
                    onChange={e => handleSaveConfig({ maxActiveSessions: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-[#0B1120] border border-white/10 text-white px-3 font-mono"
                  >
                    <option value={1}>1 Device (Personal Standard)</option>
                    <option value={3}>3 Devices (Team Plan)</option>
                    <option value={10}>10 Devices (Enterprise Plan)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Max Failed Login Attempts</label>
                  <select
                    value={secConfig.maxFailedLoginAttempts}
                    onChange={e => handleSaveConfig({ maxFailedLoginAttempts: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-[#0B1120] border border-white/10 text-white px-3 font-mono"
                  >
                    <option value={3}>3 Attempts (Strict Protection)</option>
                    <option value={5}>5 Attempts (Standard Protection)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-bold">Account Lockout Duration</label>
                  <select
                    value={secConfig.lockoutDurationMinutes}
                    onChange={e => handleSaveConfig({ lockoutDurationMinutes: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl bg-[#0B1120] border border-white/10 text-white px-3 font-mono"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <div className="text-white font-bold">Require OTP for New Devices</div>
                    <div className="text-[10px] text-slate-400">Mandatory 6-digit email verification</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={secConfig.requireOtpForNewDevices}
                    onChange={e => handleSaveConfig({ requireOtpForNewDevices: e.target.checked })}
                    className="w-5 h-5 accent-[#F5B700] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EMAIL AUDIT LOGS */}
        {activeTab === 'EMAILS' && (
          <div className="space-y-3 font-mono">
            <div className="text-[11px] text-slate-400">Security Email Notifications Sent to <strong className="text-white">{userEmail}</strong></div>

            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {emailLogs.length === 0 ? (
                <div className="p-8 text-center glass-card rounded-2xl border border-white/10 space-y-2">
                  <Mail className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-white font-bold">No Email Notifications Sent Yet</div>
                </div>
              ) : (
                emailLogs.map(log => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-[#050816] border border-white/10 space-y-1 text-left">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#F5B700]">{log.subject}</span>
                      <span className="text-[10px] text-slate-400">{new Date(log.sentAt).toLocaleTimeString()} ({new Date(log.sentAt).toLocaleDateString()})</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-sans" dangerouslySetInnerHTML={{ __html: log.bodyHtml }} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
