import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Lock, Key, Ban, UserCheck, Download,
  CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { SecurityCenterStore, type AccessRequestRecord, type LockedLinkRecord, type FailedPasswordAttempt, type BlockedIpRecord, type SecurityAlert } from '../utils/securityCenterStore';
import { AccessApprovalModal } from './AccessApprovalModal';

interface SecurityCenterViewProps {
  userRole?: string;
  onOpenViewer?: (fileId: string) => void;
}

export const SecurityCenterView: React.FC<SecurityCenterViewProps> = ({}) => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'REQUESTS' | 'LOCKED' | 'FAILED_LOGS' | 'BLOCKED_IPS'>('ALERTS');
  
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([]);
  const [lockedLinks, setLockedLinks] = useState<LockedLinkRecord[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<FailedPasswordAttempt[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpRecord[]>([]);

  const [selectedRequest, setSelectedRequest] = useState<AccessRequestRecord | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  const [manualIpInput, setManualIpInput] = useState('');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 3000);
  };

  const refreshSecurityData = () => {
    setAlerts(SecurityCenterStore.getSecurityAlerts());
    setAccessRequests(SecurityCenterStore.getAccessRequests());
    setLockedLinks(SecurityCenterStore.getLockedLinks());
    setFailedAttempts(SecurityCenterStore.getFailedAttempts());
    setBlockedIps(SecurityCenterStore.getBlockedIps());
  };

  useEffect(() => {
    refreshSecurityData();
  }, []);

  const handleUnlockLink = (shareCode: string) => {
    SecurityCenterStore.unlockLink(shareCode);
    refreshSecurityData();
    showToast(`✔ Secure link '${shareCode}' unlocked successfully.`);
  };

  const handleBlockIp = (ip: string) => {
    if (!ip.trim()) return;
    SecurityCenterStore.blockIp(ip.trim(), 'Manual Block by Security Center');
    setManualIpInput('');
    refreshSecurityData();
    showToast(`✔ IP Address '${ip.trim()}' blocked successfully.`);
  };

  const handleUnblockIp = (ip: string) => {
    SecurityCenterStore.unblockIp(ip);
    refreshSecurityData();
    showToast(`✔ IP Address '${ip}' unblocked.`);
  };

  const handleExportSecurityReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      securityAlerts: alerts,
      accessRequests,
      lockedLinks,
      failedPasswordAttempts: failedAttempts,
      blockedIps
    };
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Memomes_Security_Report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('✔ Enterprise Security & Audit Report downloaded.');
  };

  const formattedDate = (rawDate?: string) => {
    if (!rawDate) return 'Aug 4, 2026';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return rawDate;
    }
  };

  return (
    <div className="space-y-6 text-white font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* ── TOAST NOTIFICATION ───────────────────────────────────────────────── */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-[99999] p-3.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-cyan-300 shadow-2xl text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* ── TOP HEADER & SUMMARY METRICS ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
            <span>Enterprise Security Center</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time Threat Monitoring, Failed Password Audits & Access Request Approval Engine
          </p>
        </div>

        <button
          onClick={handleExportSecurityReport}
          className="btn-gold !h-9 !px-4 !text-xs shadow-lg flex items-center gap-2 font-bold"
        >
          <Download className="w-4 h-4" /> Download Security Report
        </button>
      </div>

      {/* ── METRIC CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
            Locked Links
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {lockedLinks.filter(l => !l.isUnlocked).length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-1">
          <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
            Pending Access Requests
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {accessRequests.filter(r => r.status === 'PENDING').length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
          <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
            Failed Password Audits
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {failedAttempts.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
          <div className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider">
            Blocked IP Addresses
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {blockedIps.length}
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TABS ──────────────────────────────────────────────────── */}
      <div className="flex bg-[#070B14] p-1 rounded-2xl border border-white/10 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition whitespace-nowrap ${
            activeTab === 'ALERTS'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Security Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('REQUESTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition whitespace-nowrap ${
            activeTab === 'REQUESTS'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Access Requests ({accessRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('LOCKED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition whitespace-nowrap ${
            activeTab === 'LOCKED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Locked Links ({lockedLinks.length})
        </button>

        <button
          onClick={() => setActiveTab('FAILED_LOGS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition whitespace-nowrap ${
            activeTab === 'FAILED_LOGS'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Password Failure Audits ({failedAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab('BLOCKED_IPS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition whitespace-nowrap ${
            activeTab === 'BLOCKED_IPS'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Blocked IPs ({blockedIps.length})
        </button>
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────────────── */}

      {/* TAB 1: SECURITY ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-3xl border border-white/10 space-y-2">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Security Alerts</div>
              <div className="text-xs text-slate-400">All secure links and assets are fully protected without active threats.</div>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  alert.type === 'LINK_LOCKED'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : alert.type === 'ACCESS_REQUESTED'
                    ? 'bg-cyan-950/20 border-cyan-500/30'
                    : 'bg-[#070B14] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {alert.type === 'LINK_LOCKED' ? (
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5">{alert.description}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {formattedDate(alert.timestamp)}
                  </span>
                </div>

                {alert.location && (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-300">
                    <div><span className="text-slate-500">IP:</span> {alert.ipAddress}</div>
                    <div><span className="text-slate-500">Location:</span> {alert.location}</div>
                    <div><span className="text-slate-500">Device:</span> {alert.device}</div>
                    <div><span className="text-slate-500">Status:</span> <span className="text-rose-400 font-bold">Locked</span></div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {alert.shareCode && (
                    <button
                      onClick={() => handleUnlockLink(alert.shareCode!)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Lock className="w-3.5 h-3.5" /> Unlock Link
                    </button>
                  )}
                  {alert.ipAddress && (
                    <button
                      onClick={() => handleBlockIp(alert.ipAddress!)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" /> Block IP
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ACCESS REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-3">
          {accessRequests.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-3xl border border-white/10 space-y-2">
              <UserCheck className="w-10 h-10 text-cyan-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Pending Access Requests</div>
              <div className="text-xs text-slate-400">Requests submitted by users to view or download restricted files will appear here.</div>
            </div>
          ) : (
            accessRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{req.requesterName}</span>
                    <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded">
                      {req.requesterEmail}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      req.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Requested Access to: <span className="text-white font-bold">{req.fileName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    "{req.reason}"
                  </div>
                </div>

                {req.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setSelectedRequest(req);
                      setShowApprovalModal(true);
                    }}
                    className="btn-gold !h-8 !px-3 !text-xs font-bold"
                  >
                    Review Request
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: LOCKED LINKS */}
      {activeTab === 'LOCKED' && (
        <div className="space-y-3">
          {lockedLinks.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-3xl border border-white/10 space-y-2">
              <Lock className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Locked Links</div>
              <div className="text-xs text-slate-400">Secure links locked due to failed password brute-force attempts will be listed here.</div>
            </div>
          ) : (
            lockedLinks.map((lock) => (
              <div key={lock.id} className="p-4 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{lock.fileName}</span>
                    <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-bold">
                      {lock.isUnlocked ? 'Unlocked' : 'LOCKED'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Code: <span className="text-cyan-400">{lock.shareCode}</span> · Locked: {formattedDate(lock.lockedAt)}
                  </div>
                  <div className="text-[11px] text-rose-300 font-mono">
                    Reason: {lock.reason} (Last IP: {lock.lastAttemptIp})
                  </div>
                </div>

                {!lock.isUnlocked && (
                  <button
                    onClick={() => handleUnlockLink(lock.shareCode)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5" /> Unlock Link
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: FAILED PASSWORD ATTEMPTS */}
      {activeTab === 'FAILED_LOGS' && (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#070B14] border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              <div className="col-span-3">File Target</div>
              <div className="col-span-3">IP & Location</div>
              <div className="col-span-3">Device / Browser</div>
              <div className="col-span-3 text-right">Attempt Status</div>
            </div>

            <div className="divide-y divide-white/5 font-mono text-xs">
              {failedAttempts.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 italic">No failed password attempts recorded.</div>
              ) : (
                failedAttempts.map((att) => (
                  <div key={att.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                    <div className="col-span-3 font-bold text-white truncate" title={att.fileName}>
                      {att.fileName}
                    </div>
                    <div className="col-span-3 text-slate-300 text-[11px]">
                      <div>{att.ipAddress}</div>
                      <div className="text-slate-500 text-[10px]">{att.city}, {att.country}</div>
                    </div>
                    <div className="col-span-3 text-slate-400 text-[11px]">
                      <div>{att.device}</div>
                      <div className="text-slate-500 text-[10px]">{att.browser}</div>
                    </div>
                    <div className="col-span-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.attemptNumber >= 3
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        Attempt {att.attemptNumber}/3 ({att.remainingAttempts} Left)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BLOCKED IPS */}
      {activeTab === 'BLOCKED_IPS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 flex items-center gap-3">
            <input
              type="text"
              value={manualIpInput}
              onChange={(e) => setManualIpInput(e.target.value)}
              placeholder="Enter IP Address to block e.g. 192.168.1.104"
              className="flex-1 h-9 px-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 font-mono"
            />
            <button
              onClick={() => handleBlockIp(manualIpInput)}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" /> Block IP
            </button>
          </div>

          <div className="space-y-2">
            {blockedIps.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono italic">No IP addresses currently blocked.</div>
            ) : (
              blockedIps.map((b) => (
                <div key={b.ipAddress} className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-between font-mono text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{b.ipAddress}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({b.country})</span>
                    </div>
                    <div className="text-[10px] text-rose-400">{b.reason}</div>
                  </div>
                  <button
                    onClick={() => handleUnblockIp(b.ipAddress)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition"
                  >
                    Unblock IP
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Access Approval Modal */}
      <AccessApprovalModal
        isOpen={showApprovalModal}
        request={selectedRequest}
        onClose={() => setShowApprovalModal(false)}
        onResolved={refreshSecurityData}
      />

    </div>
  );
};
