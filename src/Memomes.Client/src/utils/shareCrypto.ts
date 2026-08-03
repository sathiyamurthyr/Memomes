/**
 * Cryptographic utility to encrypt and decrypt share query parameters
 * using Web Crypto API (AES-GCM-256) with keys derived from the Share ID.
 * Includes graceful fallbacks for non-secure HTTP IP origins.
 */

// Helper to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to convert ArrayBuffer to base64url format
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function deriveKey(shareId: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKey = enc.encode(shareId.padEnd(32, '0').slice(0, 32));
  
  return window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface WatermarkConfig {
  text: string;
  font: string;
  density: string;
  rotation: number;
}

export interface ShareParams {
  tier: string;
  expiry: string;
  zk: boolean;
  oneTime: boolean;
  watermark: WatermarkConfig | null;
}

export class ShareCrypto {
  /**
   * Encrypt parameters into a single secure base64 token
   */
  static async encryptParams(
    shareId: string,
    params: ShareParams
  ): Promise<string> {
    try {
      if (!window.crypto?.subtle) {
        return arrayBufferToBase64(new TextEncoder().encode(JSON.stringify(params)).buffer);
      }

      const key = await deriveKey(shareId);
      const enc = new TextEncoder();
      const encodedData = enc.encode(JSON.stringify(params));
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      const payload = new Uint8Array(iv.length + encrypted.byteLength);
      payload.set(iv, 0);
      payload.set(new Uint8Array(encrypted), iv.length);

      return arrayBufferToBase64(payload.buffer);
    } catch (e) {
      console.error('Encryption of share params failed', e);
      return '';
    }
  }

  /**
   * Decrypt parameters from base64 token
   */
  static async decryptParams(
    shareId: string,
    encryptedBase64: string
  ): Promise<ShareParams | null> {
    try {
      if (!window.crypto?.subtle) {
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(base64ToArrayBuffer(encryptedBase64)));
      }

      const key = await deriveKey(shareId);
      const payload = new Uint8Array(base64ToArrayBuffer(encryptedBase64));
      
      const iv = payload.slice(0, 12);
      const ciphertext = payload.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return JSON.parse(dec.decode(decrypted));
    } catch (e) {
      console.error('Decryption of share params failed (Token may be tampered or invalid)', e);
      return null;
    }
  }
}
