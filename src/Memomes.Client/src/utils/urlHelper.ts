/**
 * Utility helper to determine the current application base URL dynamically.
 * Works seamlessly across Vite dev server (ports 6523, 6524), production, and standalone static file views.
 */

export const getAppBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const envUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl;
    
    // Standardize origin (e.g., http://localhost:6524 or http://192.168.0.104:6524)
    if (window.location.protocol === 'file:') {
      return 'http://localhost:6524';
    }
    return window.location.origin;
  }
  return 'http://localhost:6524';
};
