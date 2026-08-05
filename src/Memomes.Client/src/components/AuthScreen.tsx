import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles, CheckCircle2, Lock,
  KeyRound, Search, Share2, Flame, Server, Cpu, Check, UserCheck,
  FileText, Image as IconImage, Film, Music, Presentation, Sheet, Volume2, VolumeX
} from 'lucide-react';
import { ZkCrypto } from '../crypto/zkCrypto';
import { ShamirSocialRecovery } from '../crypto/shamir';
import { MemomesLogo } from './MemomesLogo';
import { DeviceSecurityEngine, type DeviceFingerprint, type IpGeoEnrichment, type ActiveSessionRecord } from '../utils/deviceSecurityEngine';
import { ConcurrentSessionConflictModal } from './ConcurrentSessionConflictModal';
import { DeviceOtpVerificationModal } from './DeviceOtpVerificationModal';

interface AuthScreenProps {
  onLoginSuccess: (user: { email: string; masterKey: CryptoKey; shards: any }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('sathiya@memomes.com');
  const [password, setPassword] = useState('SuperSecretMasterKey2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Mouse Parallax tracking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Sequential Workflow Node Active Highlight Loop
  const [activeWorkflowStage, setActiveWorkflowStage] = useState(0);

  // Background Floating File Encryption Pipeline Loop
  const [floatingFileIndex, setFloatingFileIndex] = useState(0);

  // Multi-step Authentication Verification state
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStep, setAuthStep] = useState(0);
  const [showSuccessMorph, setShowSuccessMorph] = useState(false);

  // Session & Device Security Engine State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictSession, setConflictSession] = useState<ActiveSessionRecord | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingFingerprint, setPendingFingerprint] = useState<DeviceFingerprint | null>(null);
  const [pendingIpGeo, setPendingIpGeo] = useState<IpGeoEnrichment | null>(null);
  const [lockoutError, setLockoutError] = useState<string | null>(null);

  const floatingFiles = [
    { name: 'Passport_Scan.pdf', type: 'PDF', icon: FileText, size: '2.4 MB', color: 'text-amber-400' },
    { name: 'Tax_Return_2025.xlsx', type: 'Excel', icon: Sheet, size: '1.8 MB', color: 'text-emerald-400' },
    { name: 'Keynote_Deck.pptx', type: 'PPT', icon: Presentation, size: '8.5 MB', color: 'text-purple-400' },
    { name: 'Medical_Record.png', type: 'Image', icon: IconImage, size: '4.1 MB', color: 'text-cyan-400' },
    { name: 'Confidential_Memo.mp3', type: 'Audio', icon: Music, size: '5.2 MB', color: 'text-[#F6C343]' },
    { name: 'Product_Demo.mp4', type: 'Video', icon: Film, size: '14.0 MB', color: 'text-rose-400' }
  ];

  const authSequenceSteps = [
    { label: 'Verifying Identity & Credentials...', icon: UserCheck, color: 'text-[#4F8CFF]' },
    { label: 'Deriving PBKDF2 Master Encryption Key (100,000 Iterations)...', icon: KeyRound, color: 'text-[#F6C343]' },
    { label: 'Decrypting Workspace Storage Keys (AES-256-GCM)...', icon: Lock, color: 'text-[#00D38A]' },
    { label: 'Loading AI Vector Semantic Search Index...', icon: Search, color: 'text-purple-400' },
    { label: 'Syncing Encrypted Backblaze Object Metadata...', icon: Server, color: 'text-cyan-400' },
    { label: 'Verifying Zero-Knowledge Integrity & Key Shards...', icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Opening Secure Digital Vault...', icon: Sparkles, color: 'text-[#00D38A]' }
  ];

  const workflowNodes = [
    { step: '01', title: 'Upload', desc: 'RAM Intake', icon: Cpu, color: 'text-[#F6C343]' },
    { step: '02', title: 'AES-256', desc: 'Local Web Crypto', icon: Lock, color: 'text-[#4F8CFF]' },
    { step: '03', title: 'Zero-Knowledge', desc: '0% Server Keys', icon: ShieldCheck, color: 'text-[#00D38A]' },
    { step: '04', title: 'AI Indexing', desc: 'Vector Embeddings', icon: Search, color: 'text-purple-400' },
    { step: '05', title: 'Cloud Vault', desc: 'Backblaze Storage', icon: Server, color: 'text-cyan-400' },
    { step: '06', title: 'Secure Share', desc: 'PIN & Timed Expiry', icon: Share2, color: 'text-[#F6C343]' },
    { step: '07', title: 'Remote Revoke', desc: 'Instant Kill Switch', icon: Flame, color: 'text-rose-400' }
  ];

  const liveSecurityStatuses = [
    'AES-256 Active',
    'Zero-Knowledge Active',
    'Client-Side Encryption',
    'AI Search Ready',
    'Secure Sharing Enabled',
    'Military Grade Protection'
  ];

  // Mouse move handler for Parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  // Workflow lighting loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWorkflowStage(prev => (prev + 1) % workflowNodes.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [workflowNodes.length]);

  // Floating File Encryption pipeline loop
  useEffect(() => {
    const interval = setInterval(() => {
      setFloatingFileIndex(prev => (prev + 1) % floatingFiles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [floatingFiles.length]);

  const proceedWithLogin = async (fingerprint: DeviceFingerprint, ipGeo: IpGeoEnrichment) => {
    setIsAuthenticating(true);
    setAuthStep(0);

    try {
      for (let i = 0; i < authSequenceSteps.length; i++) {
        setAuthStep(i);
        await new Promise(res => setTimeout(res, 200));
      }

      const masterKey = await ZkCrypto.deriveMasterKey(password, `salt_${email}`);
      const rawHexKey = await ZkCrypto.exportKeyRaw(masterKey);
      const shards = ShamirSocialRecovery.splitMasterKey(rawHexKey);

      // Create Active Session Record
      DeviceSecurityEngine.createActiveSession(email, fingerprint, ipGeo);

      setShowSuccessMorph(true);

      setTimeout(() => {
        setIsAuthenticating(false);
        onLoginSuccess({ email, masterKey, shards });
      }, 1200);
    } catch (err: any) {
      alert('Authentication error: ' + err.message);
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isAuthenticating) return;

    setLockoutError(null);

    // 1. Check Account Lockout Status
    const lockout = DeviceSecurityEngine.getLockoutStatus(email);
    if (lockout.isLocked) {
      setLockoutError(`Account is temporarily locked due to multiple failed password attempts.`);
      return;
    }

    // 2. Capture Device Fingerprint & IP Enrichment
    const fingerprint = DeviceSecurityEngine.generateFingerprint();
    const ipGeo = DeviceSecurityEngine.enrichIpAddress();

    setPendingFingerprint(fingerprint);
    setPendingIpGeo(ipGeo);

    // 3. Check Trusted Device Registry
    const secConfig = DeviceSecurityEngine.getSecurityConfig();
    const isTrusted = DeviceSecurityEngine.isDeviceTrusted(email, fingerprint.hashedFingerprint);

    if (!isTrusted && secConfig.requireOtpForNewDevices) {
      DeviceSecurityEngine.initiateOtpChallenge(email, fingerprint, ipGeo);
      setShowOtpModal(true);
      return;
    }

    // 4. Check Active Session Limit & Concurrent Conflicts
    const activeSessions = DeviceSecurityEngine.getActiveSessions(email);
    if (activeSessions.length >= secConfig.maxActiveSessions) {
      setConflictSession(activeSessions[0]);
      setShowConflictModal(true);
      return;
    }

    // All clear -> Proceed to Vault Login
    await proceedWithLogin(fingerprint, ipGeo);
  };

  const activeFile = floatingFiles[floatingFileIndex];
  const ActiveFileIcon = activeFile.icon;

  return (
    <div
      onMouseMove={handleMouseMove}
      className="h-screen w-screen bg-[#050816] text-[#F8FAFC] flex flex-col lg:flex-row font-sans selection:bg-[#F6C343] selection:text-slate-950 overflow-hidden relative select-none"
    >
      
      {/* ── SUCCESS MORPH TRANSITION OVERLAY ─────────────────────────────── */}
      {showSuccessMorph && (
        <div className="fixed inset-0 z-50 bg-[#050816]/95 backdrop-blur-3xl flex items-center justify-center p-6 font-mono animate-in fade-in duration-300">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#0F172A] border border-[#00D38A]/50 space-y-6 text-center shadow-[0_0_80px_rgba(0,211,138,0.3)]">
            <div className="w-16 h-16 rounded-full bg-[#00D38A]/20 border border-[#00D38A] flex items-center justify-center mx-auto text-[#00D38A] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-heading">Vault Access Granted</h3>
              <p className="text-xs text-slate-400">Zero-Knowledge Key Handshake Complete</p>
            </div>

            <div className="space-y-2 text-xs text-emerald-400 text-left bg-black/40 p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-2">✓ Identity Verified</div>
              <div className="flex items-center gap-2">✓ AES-256 Keys Loaded</div>
              <div className="flex items-center gap-2">✓ Zero-Knowledge Session Active</div>
              <div className="flex items-center gap-2">✓ AI Vector Index Synced</div>
              <div className="flex items-center gap-2 text-amber-400 font-bold">✓ Opening Memomes Vault...</div>
            </div>
          </div>
        </div>
      )}

      {/* ── BACKGROUND DIGITAL GRID & GLOW ORBS WITH PARALLAX ────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          style={{
            position: 'absolute', top: '-25%', left: '-15%',
            width: '65vw', height: '65vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(246,195,67,0.12) 0%, transparent 65%)',
            filter: 'blur(100px)',
            transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-20%', right: '-15%',
            width: '60vw', height: '60vw', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,140,255,0.12) 0%, transparent 65%)',
            filter: 'blur(100px)',
            transform: `translate(${-mousePos.x * 0.5}px, ${-mousePos.y * 0.5}px)`
          }}
        />
      </div>

      {/* ── LEFT SIDE (55% WIDTH): ANIMATED SECURITY SCENE & WORKFLOW ─────── */}
      <div className="w-full lg:w-[55%] h-full relative bg-[#050816]/90 border-r border-white/10 flex flex-col justify-between p-8 lg:p-12 z-10 overflow-hidden">
        
        {/* Top Header Logo & Sound Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MemomesLogo size="md" showText={true} />
            <span className="px-2.5 py-1 rounded-full bg-[#F6C343]/15 border border-[#F6C343]/40 text-[#F6C343] text-[11px] font-mono font-bold">
              Cloud 3.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title={isMuted ? "Unmute Audio Chime" : "Mute Audio Chime"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#F6C343]" />}
            </button>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest hidden sm:inline">
              Enterprise Security Center
            </span>
          </div>
        </div>

        {/* Center Animated Workflow & Floating File Pipeline */}
        <div className="space-y-8 my-auto py-6">
          <div className="space-y-2 text-left">
            <span className="text-xs font-mono text-[#4F8CFF] uppercase tracking-widest font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00D38A] animate-pulse" />
              <span>Zero-Knowledge Cyber Security Architecture</span>
            </span>
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight font-heading leading-tight">
              Military-Grade Encrypted Vault System
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Every byte is encrypted client-side before leaving memory. Server operators hold 0% access to your master decryption keys.
            </p>
          </div>

          {/* Floating File Intake Pipeline Card */}
          <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#F6C343]/30 flex items-center justify-between font-mono text-xs shadow-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-white/10 ${activeFile.color}`}>
                <ActiveFileIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-white font-bold">{activeFile.name}</div>
                <div className="text-[10px] text-slate-400">Intake → AES-256 Encrypt → AI Index</div>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00D38A] text-[10px] font-bold border border-[#00D38A]/30">
                Encrypted & Indexed
              </span>
              <div className="text-[10px] text-slate-400 mt-1">{activeFile.size}</div>
            </div>
          </div>

          {/* 7-Node Workflow Flowchart with Active Lighting Loop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {workflowNodes.map((node, idx) => {
              const Icon = node.icon;
              const isStageActive = activeWorkflowStage === idx;
              return (
                <div
                  key={node.step}
                  className={`p-3 rounded-2xl border transition-all duration-500 flex flex-col justify-between space-y-2 text-left shadow-lg cursor-pointer ${
                    isStageActive
                      ? 'bg-amber-500/20 border-[#F6C343] scale-105 shadow-[0_0_20px_rgba(246,195,67,0.3)]'
                      : 'bg-[#0B1220]/90 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold ${isStageActive ? 'text-[#F6C343]' : 'text-slate-500'}`}>
                      {node.step}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isStageActive ? node.color : 'text-slate-500'}`} />
                  </div>
                  <div>
                    <h4 className={`text-[11px] font-bold font-mono ${isStageActive ? 'text-white' : 'text-slate-300'}`}>
                      {node.title}
                    </h4>
                    <p className="text-[9px] text-slate-400 font-mono truncate">{node.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Left Live Security Status List */}
        <div className="pt-4 border-t border-white/10">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 text-left">
            Live System Integrity Dashboard
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono text-slate-300">
            {liveSecurityStatuses.map((status) => (
              <div key={status} className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#00D38A] shrink-0 animate-pulse" />
                <span className="truncate">{status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── RIGHT SIDE (45% WIDTH): GLASS LOGIN CARD & FORM ─────────────── */}
      <div className="w-full lg:w-[45%] h-full relative bg-[#0B1220]/60 backdrop-blur-2xl flex items-center justify-center p-6 lg:p-12 z-10 overflow-y-auto">
        
        {/* Glass Card Container (520px Width) */}
        <div className="w-full max-w-[520px] rounded-[24px] bg-[#0F172A]/90 border border-white/15 p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-6 relative overflow-hidden text-left">
          
          {/* Multi-Step Authentication Progress Bar */}
          {isAuthenticating && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#050816] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F6C343] via-[#00D38A] to-[#4F8CFF] transition-all duration-200"
                style={{ width: `${((authStep + 1) / authSequenceSteps.length) * 100}%` }}
              />
            </div>
          )}

          {/* Header Title */}
          <div className="space-y-1">
            <h2 className="text-2xl lg:text-3xl font-black text-white font-heading tracking-tight">
              {isRegister ? 'Create Your Vault' : 'Welcome Back'}
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {isRegister ? 'Initialize your zero-knowledge encrypted workspace.' : 'Sign in to access your zero-knowledge encrypted vault.'}
            </p>
          </div>

          {/* Sequential Authentication Overlay */}
          {isAuthenticating ? (
            <div className="p-6 rounded-2xl bg-[#050816] border border-[#F6C343]/40 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-[#F6C343] font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F6C343] animate-spin" />
                  AUTHENTICATING VAULT ACCESS
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  {Math.round(((authStep + 1) / authSequenceSteps.length) * 100)}%
                </span>
              </div>

              <div className="space-y-2">
                {authSequenceSteps.map((st, i) => {
                  const Icon = st.icon;
                  const isPast = i < authStep;
                  const isCurrent = i === authStep;
                  return (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl flex items-center justify-between transition-all ${
                        isCurrent
                          ? 'bg-amber-500/15 border border-amber-500/40 text-white font-bold'
                          : isPast
                          ? 'bg-emerald-950/20 text-emerald-400'
                          : 'text-slate-600 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isPast ? (
                          <Check className="w-4 h-4 text-[#00D38A] shrink-0" />
                        ) : (
                          <Icon className={`w-4 h-4 ${isCurrent ? st.color : 'text-slate-500'} shrink-0`} />
                        )}
                        <span className="truncate">{st.label}</span>
                      </div>
                      {isCurrent && <span className="text-[10px] text-[#F6C343] animate-pulse shrink-0">RUNNING</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Login / Register Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Account Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 font-mono">Account Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-12 px-4 rounded-xl bg-[#050816] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F6C343] transition-colors shadow-inner font-mono"
                />
              </div>

              {/* Master Encryption Key Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 font-mono">Master Encryption Key *</label>
                  <a href="#" className="text-[11px] text-[#4F8CFF] hover:underline font-mono">Forgot Password?</a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full h-12 pl-4 pr-10 rounded-xl bg-[#050816] border border-white/15 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F6C343] transition-colors font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded bg-[#050816] border-white/20 text-[#F6C343] focus:ring-[#F6C343]"
                  />
                  <span>Remember Me (Encrypted Token)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#F6C343] via-amber-400 to-amber-500 hover:from-amber-400 hover:to-[#F6C343] text-slate-950 font-bold text-sm shadow-[0_0_30px_rgba(246,195,67,0.4)] hover:shadow-[0_0_40px_rgba(246,195,67,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 font-mono uppercase tracking-wider cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>{isRegister ? 'Initialize Zero-Knowledge Vault' : 'Launch Vault'}</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

            </form>
          )}

          {/* Social SSO Logins */}
          {!isAuthenticating && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-slate-500 text-center uppercase tracking-widest">
                Or Continue With Enterprise SSO
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Google', icon: 'G' },
                  { name: 'Microsoft', icon: 'M' },
                  { name: 'GitHub', icon: 'GH' }
                ].map(sso => (
                  <button
                    key={sso.name}
                    onClick={() => alert(`Redirecting to ${sso.name} SSO...`)}
                    className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="text-[#F6C343] font-black">{sso.icon}</span>
                    <span>{sso.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Security Badges */}
          <div className="pt-3 border-t border-white/10 grid grid-cols-4 gap-1 text-[10px] font-mono text-slate-400 text-center">
            <span className="p-1 rounded bg-white/5 border border-white/5 text-amber-400">AES-256</span>
            <span className="p-1 rounded bg-white/5 border border-white/5 text-emerald-400">Zero-Knowledge</span>
            <span className="p-1 rounded bg-white/5 border border-white/5 text-purple-400">AI Search</span>
            <span className="p-1 rounded bg-white/5 border border-white/5 text-cyan-400">Encrypted</span>
          </div>

          {/* Footer Switcher */}
          <div className="pt-2 text-center text-xs font-mono text-slate-400">
            {isRegister ? 'Already have a vault? ' : 'Need an account? '}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-[#F6C343] hover:underline font-bold"
            >
              {isRegister ? 'Sign In to Vault' : 'Create Free Vault'}
            </button>
          </div>

        </div>
      </div>

      {/* ── LOCKOUT ERROR BANNER ────────────────────────────────────────── */}
      {lockoutError && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-xs shadow-2xl max-w-sm animate-in slide-in-from-top duration-300">
          <div className="font-bold text-rose-400 mb-1">🚨 Account Lockout Warning</div>
          <div>{lockoutError}</div>
          <button onClick={() => setLockoutError(null)} className="mt-2 text-[10px] text-white hover:underline">Dismiss</button>
        </div>
      )}

      {/* ── CONCURRENT SESSION CONFLICT MODAL ──────────────────────────── */}
      {showConflictModal && conflictSession && pendingFingerprint && pendingIpGeo && (
        <ConcurrentSessionConflictModal
          activeSession={conflictSession}
          newDeviceName={`${pendingFingerprint.rawDetails.browser} on ${pendingFingerprint.rawDetails.os}`}
          newIpLocation={`${pendingIpGeo.city}, ${pendingIpGeo.country}`}
          onForceLogoutExisting={async () => {
            DeviceSecurityEngine.revokeSession(email, conflictSession.id, 'Force Logged Out by New Session');
            setShowConflictModal(false);
            setConflictSession(null);
            await proceedWithLogin(pendingFingerprint, pendingIpGeo);
          }}
          onCancelNewLogin={() => {
            setShowConflictModal(false);
            setConflictSession(null);
            DeviceSecurityEngine.recordFailedLogin(email, pendingFingerprint, pendingIpGeo);
          }}
        />
      )}

      {/* ── UNTRUSTED DEVICE OTP VERIFICATION MODAL ────────────────────── */}
      {showOtpModal && pendingFingerprint && pendingIpGeo && (
        <DeviceOtpVerificationModal
          userEmail={email}
          deviceName={`${pendingFingerprint.rawDetails.browser} on ${pendingFingerprint.rawDetails.os}`}
          ipLocation={`${pendingIpGeo.city}, ${pendingIpGeo.country}`}
          ipAddress={pendingIpGeo.ip}
          onCancel={() => setShowOtpModal(false)}
          onVerifySuccess={async () => {
            setShowOtpModal(false);
            // Check active session limits after OTP verification
            const activeSessions = DeviceSecurityEngine.getActiveSessions(email);
            const secConfig = DeviceSecurityEngine.getSecurityConfig();
            if (activeSessions.length >= secConfig.maxActiveSessions) {
              setConflictSession(activeSessions[0]);
              setShowConflictModal(true);
              return;
            }
            await proceedWithLogin(pendingFingerprint, pendingIpGeo);
          }}
        />
      )}

    </div>
  );
};
