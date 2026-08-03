/**
 * Memomes Cloud Multi-Sensory Feedback Engine
 * 
 * Provides Apple/Google Pixel/Stripe-grade feedback across 5 levels:
 * - Level 1: Subtle (Click, toggle, folder open)
 * - Level 2: Normal Success (Save, rename, link copied)
 * - Level 3: Major Success (Upload complete, vault created, confetti)
 * - Level 4: Warning (Duplicate file, low storage)
 * - Level 5: Critical Error (Network lost, virus detected, delete)
 */

export type FeedbackLevel = 'level1_subtle' | 'level2_success' | 'level3_major' | 'level4_warning' | 'level5_critical';

export interface FeedbackSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  celebrationsEnabled: boolean;
  reducedMotion: boolean;
}

const SETTINGS_STORAGE_KEY = 'memomes_feedback_settings';

export class FeedbackEngine {
  private static settings: FeedbackSettings = FeedbackEngine.loadSettings();
  private static audioCtx: AudioContext | null = null;

  static loadSettings(): FeedbackSettings {
    try {
      if (typeof window === 'undefined') {
        return { soundEnabled: true, hapticsEnabled: true, celebrationsEnabled: true, reducedMotion: false };
      }
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.debug('Failed to load feedback settings', e);
    }
    return { soundEnabled: true, hapticsEnabled: true, celebrationsEnabled: true, reducedMotion: false };
  }

  static saveSettings(newSettings: Partial<FeedbackSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.debug('Failed to save feedback settings', e);
    }
  }

  static getSettings(): FeedbackSettings {
    return { ...this.settings };
  }

  private static getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return null;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Triggers Haptic Vibration (Mobile Native Haptics API)
   */
  static triggerHaptic(pattern: number | number[]) {
    if (!this.settings.hapticsEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics not supported or blocked
    }
  }

  /**
   * Synthesizes audio tones for each level using Web Audio API
   */
  static triggerAudio(level: FeedbackLevel) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      if (level === 'level1_subtle') {
        // Level 1: Tiny micro-click (1000Hz, 30ms, 15% volume)
        masterGain.gain.setValueAtTime(0.12, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.04);
      } 
      else if (level === 'level2_success') {
        // Level 2: Soft success chime (587Hz D5 -> 880Hz A5, 250ms)
        masterGain.gain.setValueAtTime(0.25, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
      } 
      else if (level === 'level3_major') {
        // Level 3: Golden chord (D5 587Hz -> F#5 739Hz -> A5 880Hz, 500ms)
        masterGain.gain.setValueAtTime(0.3, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        osc1.connect(masterGain);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(739.99, now + 0.04);
        osc2.connect(masterGain);

        osc1.start(now);
        osc2.start(now + 0.04);
        osc1.stop(now + 0.55);
        osc2.stop(now + 0.55);
      } 
      else if (level === 'level4_warning') {
        // Level 4: Warning tone (440Hz -> 350Hz, 300ms)
        masterGain.gain.setValueAtTime(0.2, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(350, now + 0.2);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
      } 
      else if (level === 'level5_critical') {
        // Level 5: Error tone (Low double pulse)
        masterGain.gain.setValueAtTime(0.25, now);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.debug('Audio feedback blocked', e);
    }
  }

  /**
   * Main Dispatcher for Multi-Sensory Feedback
   */
  static trigger(level: FeedbackLevel) {
    switch (level) {
      case 'level1_subtle':
        this.triggerHaptic(10); // Light impact
        this.triggerAudio('level1_subtle');
        break;

      case 'level2_success':
        this.triggerHaptic(25); // Medium impact
        this.triggerAudio('level2_success');
        break;

      case 'level3_major':
        this.triggerHaptic([30, 50, 40]); // Heavy multi-stage impact
        this.triggerAudio('level3_major');
        break;

      case 'level4_warning':
        this.triggerHaptic([15, 30, 15]); // Double pulse
        this.triggerAudio('level4_warning');
        break;

      case 'level5_critical':
        this.triggerHaptic([60, 40, 60]); // Long error pulse
        this.triggerAudio('level5_critical');
        break;
    }
  }
}
