export const getAppBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Check environment variables first, fallback to window.location.origin
    const envUrl = (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.NEXT_PUBLIC_APP_URL;
    if (envUrl) return envUrl;
    return window.location.origin;
  }
  return 'http://localhost:5173';
};
