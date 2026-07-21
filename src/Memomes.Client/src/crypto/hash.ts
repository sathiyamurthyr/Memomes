/**
 * Client-Side Deterministic SHA-256 Hashing Engine for Zero-Knowledge Deduplication.
 */
export class ClientHasher {
  /**
   * Calculate SHA-256 hash of file content combined with user master key
   */
  static async calculateContentHash(fileBuffer: ArrayBuffer, userSalt: string): Promise<string> {
    const encoder = new TextEncoder();
    const saltBytes = encoder.encode(userSalt);

    // Combine raw file bytes with user salt to create a ZK deterministic hash
    const combined = new Uint8Array(fileBuffer.byteLength + saltBytes.byteLength);
    combined.set(new Uint8Array(fileBuffer), 0);
    combined.set(saltBytes, fileBuffer.byteLength);

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
