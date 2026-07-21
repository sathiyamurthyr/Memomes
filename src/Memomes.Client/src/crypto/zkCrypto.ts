/**
 * Zero-Knowledge Client Cryptography Pipeline using standard Web Crypto API
 * AES-256-GCM chunked encryption/decryption with 12-byte random nonces & 16-byte auth tags.
 * Raw bytes and master keys NEVER leave the client browser.
 */

export interface EncryptedChunk {
  chunkIndex: number;
  nonce: Uint8Array; // 12 bytes
  data: Uint8Array;  // Encrypted bytes + 16-byte tag
}

export class ZkCrypto {
  /**
   * Derive a 256-bit AES-GCM Master Key from password and salt using PBKDF2 (100,000+ iterations)
   */
  static async deriveMasterKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const saltBytes = encoder.encode(salt);

    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      passwordBytes as any,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes as any,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a 10 MB binary chunk using AES-256-GCM with a fresh random 12-byte nonce
   */
  static async encryptChunk(
    chunkData: ArrayBuffer,
    masterKey: CryptoKey,
    chunkIndex: number
  ): Promise<EncryptedChunk> {
    // Generate strict 12-byte random nonce / IV per chunk
    const nonce = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce as any,
        tagLength: 128 // 16-byte tag
      },
      masterKey,
      chunkData
    );

    return {
      chunkIndex,
      nonce,
      data: new Uint8Array(encryptedBuffer)
    };
  }

  /**
   * Decrypt an encrypted chunk using AES-256-GCM and its 12-byte nonce
   */
  static async decryptChunk(
    encryptedChunk: EncryptedChunk,
    masterKey: CryptoKey
  ): Promise<ArrayBuffer> {
    return await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encryptedChunk.nonce as any,
        tagLength: 128
      },
      masterKey,
      encryptedChunk.data as any
    );
  }

  /**
   * Export CryptoKey to raw hex or base64 for key envelope operations
   */
  static async exportKeyRaw(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(exported))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Import raw hex key back to CryptoKey
   */
  static async importKeyRaw(hexKey: string): Promise<CryptoKey> {
    const hexMatches = hexKey.match(/.{1,2}/g) || [];
    const byteNumbers = hexMatches.map(b => parseInt(b, 16));
    const rawBytes = new Uint8Array(byteNumbers);

    return window.crypto.subtle.importKey(
      'raw',
      rawBytes as any,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }
}
