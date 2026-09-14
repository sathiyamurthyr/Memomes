/**
 * antiScreenshotEngine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — HARDENED ANTI-SCREENSHOT & SCREEN RECORDING SHIELD
 *
 * Implements strict zero-knowledge DRM protection across the entire application:
 * 1. Blocks screenshot shortcuts (PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, Ctrl+Shift+S)
 * 2. Blocks screen recording shortcuts (Win+Alt+R, Win+G, QuickTime)
 * 3. Intercepts navigator.mediaDevices.getDisplayMedia screen capture unconditionally
 * 4. Pitch-black screen blanking on window blur (Snipping Tool, external recorders) & visibility change
 * 5. Automatically restores view when window focus safely returns
 * 6. Prevents clipboard leaks via silent zero-prompt clipboard sanitization
 * 7. Enforces global protection across entire application (Dashboard, Explorer, Previews, Shares)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export class AntiScreenshotEngine {
  private static isShieldActive = false;
  private static isEnabled = true;
  private static listenersAttached = false;
  private static callbacks: Set<(active: boolean, reason: string) => void> = new Set();
  private static originalGetDisplayMedia: any = null;
  private static lastReason = '';
  private static autoDismissTimer: any = null;

  /**
   * Subscribe to shield state changes. Active across the whole application.
   */
  public static subscribe(callback: (active: boolean, reason: string) => void): () => void {
    this.callbacks.add(callback);
    this.ensureInitialized();
    // Emit current state immediately
    callback(this.isShieldActive, this.lastReason || 'INITIAL');
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Initialize global capture defense hooks across the entire window and DOM.
   */
  public static ensureInitialized(): void {
    if (this.listenersAttached || typeof window === 'undefined') return;
    this.listenersAttached = true;

    // 1. Inject CSS Protection Shield
    this.injectCssShield();

    // 2. Intercept screen capture / recording APIs
    this.trapScreenCaptureApis();

    // 3. Attach keyboard capture listeners (Capturing phase for highest priority)
    window.addEventListener('keydown', this.handleKeyDown, true);
    window.addEventListener('keyup', this.handleKeyUp, true);

    // 4. Attach window focus / blur / visibility listeners
    window.addEventListener('blur', this.handleBlur, true);
    window.addEventListener('focus', this.handleFocus, true);
    document.addEventListener('visibilitychange', this.handleVisibilityChange, true);

    // 5. Disable context menu, selection, drag, and copy
    document.addEventListener('contextmenu', this.preventScopedEvent, true);
    document.addEventListener('copy', this.preventScopedEvent, true);
    document.addEventListener('cut', this.preventScopedEvent, true);
    document.addEventListener('dragstart', this.preventScopedEvent, true);
    document.addEventListener('selectstart', this.preventScopedEvent, true);
  }

  /**
   * Trigger the DRM capture shield and sanitize system clipboard.
   */
  public static triggerShield(reason: string): void {
    if (!this.isEnabled) return;
    this.isShieldActive = true;
    this.lastReason = reason;

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.add('memomes-shield-active');
    }

    this.sanitizeClipboardSilently();
    this.notifyCallbacks(true, reason);

    // Dispatch DOM event for any non-React listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('memomes-anti-capture-triggered', { detail: { reason } }));
    }
  }

  /**
   * Dismiss the DRM capture shield.
   */
  public static dismissShield(): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }
    this.isShieldActive = false;
    this.lastReason = '';

    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.remove('memomes-shield-active');
    }

    this.notifyCallbacks(false, 'DISMISSED');
  }

  public static isProtected(): boolean {
    return this.isShieldActive;
  }

  public static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.isShieldActive) {
      this.dismissShield();
    }
  }

  private static notifyCallbacks(active: boolean, reason: string): void {
    this.callbacks.forEach(cb => {
      try {
        cb(active, reason);
      } catch (e) {
        console.warn('[AntiScreenshotEngine] Callback error:', e);
      }
    });
  }

  private static preventScopedEvent = (e: Event): void => {
    if (!this.isEnabled) return;

    const target = e.target as HTMLElement | null;
    const isInsideProtected = target?.closest?.('.memomes-protected-viewport') || target?.tagName === 'VIDEO' || target?.tagName === 'CANVAS' || target?.tagName === 'IMG';
    if (isInsideProtected || this.isShieldActive) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  private static handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // ── 1. PrintScreen / Snapshot key ───────────────────────────────────────
    if (
      e.key === 'PrintScreen' ||
      e.key === 'Snapshot' ||
      e.keyCode === 44 ||
      e.code === 'PrintScreen'
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('PrintScreen shortcut detected');
      return;
    }

    // ── 2. Windows Snipping Tool (Win + Shift + S) or Meta Key Pressed ───────
    if (
      ((e.metaKey || e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') &&
        (e.shiftKey || e.key === 'Shift')) ||
      (e.shiftKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS') && (e.metaKey || e.ctrlKey))
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('Screen snip shortcut (Win+Shift+S / Cmd+Shift) detected');
      return;
    }

    // ── 3. macOS Screenshot Shortcuts (Cmd + Shift + 3 / 4 / 5 / 6) ──────────
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5', '6', '$', '%', '#', '^'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('macOS Screenshot/Recording shortcut detected');
      return;
    }

    // ── 4. Windows Screen Recording (Win + Alt + R) or Game Bar (Win + G) ───
    if (
      (e.metaKey || e.altKey) &&
      (e.key === 'r' || e.key === 'R' || e.code === 'KeyR' || e.key === 'g' || e.key === 'G' || e.code === 'KeyG')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('Screen recording shortcut (Win+Alt+R / GameBar) detected');
      return;
    }

    // ── 5. Browser Screenshot (Ctrl + Shift + S) ────────────────────────────
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.code === 'KeyS')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('Browser capture shortcut (Ctrl+Shift+S) detected');
      return;
    }

    // ── 6. Print to PDF / Save Webpage (Ctrl+P, Ctrl+S) ─────────────────────
    if ((e.ctrlKey || e.metaKey) && ['p', 'P', 's', 'S'].includes(e.key)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('Print/Save document shortcut detected');
      return;
    }

    // ── 7. Developer Tools (F12, Ctrl+Shift+I/J/C, Ctrl+U) ──────────────────
    if (
      e.key === 'F12' ||
      ((e.ctrlKey || e.metaKey) && ['u', 'U'].includes(e.key)) ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key))
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('Developer tools inspection blocked');
      return;
    }
  };

  private static handleKeyUp = (e: KeyboardEvent): void => {
    if (!this.isEnabled) return;
    if (
      e.key === 'PrintScreen' ||
      e.key === 'Snapshot' ||
      e.keyCode === 44 ||
      e.code === 'PrintScreen'
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      this.triggerShield('PrintScreen key release detected');
    }
  };

  private static handleBlur = (): void => {
    if (!this.isEnabled) return;
    // When window loses focus (e.g. Snipping Tool Win+Shift+S, Lightshot, Game Bar, external recorder overlay),
    // immediately blank out the screen to prevent external capture
    setTimeout(() => {
      if (typeof document !== 'undefined' && !document.hasFocus()) {
        this.triggerShield('Window lost focus / External capture tool detected');
      }
    }, 40);
  };

  private static handleFocus = (): void => {
    // When focus returns, verify that the document has focus and allow safe auto-dismiss
    if (this.isShieldActive) {
      setTimeout(() => {
        if (typeof document !== 'undefined' && document.hasFocus()) {
          this.dismissShield();
        }
      }, 700);
    }
  };

  private static handleVisibilityChange = (): void => {
    if (!this.isEnabled) return;
    if (document.hidden) {
      this.triggerShield('Application tab backgrounded / minimized');
    } else {
      setTimeout(() => {
        if (document.hasFocus()) {
          this.dismissShield();
        }
      }, 400);
    }
  };

  /**
   * Sanitizes the clipboard without triggering Chrome's permission prompt.
   */
  public static sanitizeClipboardSilently(): void {
    const warningText = '🔒 [MEMOMES ZERO-KNOWLEDGE SECURITY] Screen capture and recording are strictly prohibited on this vault resource.';
    try {
      if (typeof document !== 'undefined' && document.body) {
        const el = document.createElement('textarea');
        el.value = warningText;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        el.style.top = '-9999px';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
    } catch {
      // Ignore if execCommand fails in headless context
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(warningText).catch(() => {});
    }
  }

  /**
   * Intercepts MediaDevices.getDisplayMedia to prevent screen recording via web apps unconditionally.
   */
  private static trapScreenCaptureApis(): void {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    try {
      const mediaDevices = navigator.mediaDevices as any;
      if (mediaDevices.getDisplayMedia && !this.originalGetDisplayMedia) {
        this.originalGetDisplayMedia = mediaDevices.getDisplayMedia.bind(mediaDevices);
        mediaDevices.getDisplayMedia = async (...args: any[]) => {
          this.triggerShield('Screen recording API (navigator.mediaDevices.getDisplayMedia) blocked');
          throw new DOMException('Screen recording is strictly prohibited by Memomes Zero-Knowledge Policy.', 'NotAllowedError');
        };
      }
    } catch {
      // Ignore in unsupported environments
    }
  }

  /**
   * Injects global DRM and print shielding styles.
   */
  private static injectCssShield(): void {
    if (typeof document === 'undefined' || document.getElementById('memomes-anti-capture-shield')) return;

    const style = document.createElement('style');
    style.id = 'memomes-anti-capture-shield';
    style.textContent = `
      /* Global print shield — blanks entire document on print attempt */
      @media print {
        html, body, #root, * {
          display: none !important;
          visibility: hidden !important;
          background: #000000 !important;
          color: #000000 !important;
          opacity: 0 !important;
        }
      }

      /* When capture shield is active, blank the body background */
      body.memomes-shield-active {
        background-color: #060910 !important;
      }

      /* Disable selection, dragging, and inspect on protected elements */
      .memomes-protected-viewport,
      .memomes-protected-viewport *,
      video,
      canvas,
      img {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        -khtml-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Auto-initialize immediately on script load in browser
if (typeof window !== 'undefined') {
  AntiScreenshotEngine.ensureInitialized();
}
