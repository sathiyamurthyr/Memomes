/**
 * Memomes Cloud Low-Bandwidth & Adaptive Network Engine
 * 
 * Auto-detects network conditions (2G/3G/4G/WiFi & Save-Data header)
 * and dynamically throttles UI animations, thumbnail resolution, and AI background fetching.
 */

export interface NetworkProfile {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g' | 'wifi';
  downlink: number; // Mbps
  rtt: number; // ms latency
  saveData: boolean;
  isLowBandwidth: boolean;
  thumbnailQuality: 'low' | 'medium' | 'high';
  animationsEnabled: boolean;
  lazyLoadAi: boolean;
}

export class BandwidthEngine {
  static getProfile(): NetworkProfile {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
        isLowBandwidth: false,
        thumbnailQuality: 'high',
        animationsEnabled: true,
        lazyLoadAi: false
      };
    }

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    const effectiveType = conn?.effectiveType || '4g';
    const downlink = conn?.downlink || 10;
    const rtt = conn?.rtt || 50;
    const saveData = Boolean(conn?.saveData);

    const isLowBandwidth = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g' || downlink < 1.5 || saveData;

    return {
      effectiveType,
      downlink,
      rtt,
      saveData,
      isLowBandwidth,
      thumbnailQuality: isLowBandwidth ? 'low' : 'high',
      animationsEnabled: !isLowBandwidth,
      lazyLoadAi: isLowBandwidth
    };
  }

  static subscribe(onChange: (profile: NetworkProfile) => void): () => void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return () => {};

    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    if (!conn) return () => {};

    const handleNetworkChange = () => {
      onChange(this.getProfile());
    };

    conn.addEventListener('change', handleNetworkChange);
    return () => {
      conn.removeEventListener('change', handleNetworkChange);
    };
  }
}
