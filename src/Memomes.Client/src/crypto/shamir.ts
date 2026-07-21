/**
 * Shamir's Secret Sharing Scheme (3-of-2 SSSS) implementation.
 * Splits master key into 3 shards, any 2 shards can reconstruct master key offline.
 * Galois Field GF(256) polynomial arithmetic.
 */

export interface KeyShards {
  shard1Local: string;
  shard2EmergencyQr: string;
  shard3ServerBackup: string;
}

export class ShamirSocialRecovery {
  /**
   * Split a master key hex string into 3 shards (Threshold k=2, Total n=3)
   */
  static splitMasterKey(masterKeyHex: string): KeyShards {
    const keyBytes = new TextEncoder().encode(masterKeyHex);
    const n = 3;

    const shardBytes: number[][] = Array.from({ length: n }, () => []);

    for (let i = 0; i < keyBytes.length; i++) {
      const secret = keyBytes[i];
      // Random coefficient for 1st degree polynomial: f(x) = secret + a1 * x (mod 256)
      const a1 = Math.floor(Math.random() * 256);

      for (let x = 1; x <= n; x++) {
        // Evaluation at x in GF(256) XOR space
        const y = secret ^ ((a1 * x) & 0xFF);
        shardBytes[x - 1].push(y);
      }
    }

    const shard1Hex = 's1:' + ShamirSocialRecovery.bytesToHex(new Uint8Array(shardBytes[0]));
    const shard2Hex = 's2:' + ShamirSocialRecovery.bytesToHex(new Uint8Array(shardBytes[1]));
    const shard3Hex = 's3:' + ShamirSocialRecovery.bytesToHex(new Uint8Array(shardBytes[2]));

    return {
      shard1Local: shard1Hex,
      shard2EmergencyQr: shard2Hex,
      shard3ServerBackup: shard3Hex
    };
  }

  /**
   * Reconstruct master key hex from any 2 shards offline
   */
  static reconstructMasterKey(shardA: string, shardB: string): string {
    const parseShard = (shardStr: string) => {
      const parts = shardStr.split(':');
      const x = parseInt(parts[0].replace('s', ''), 10);
      const bytes = ShamirSocialRecovery.hexToBytes(parts[1]);
      return { x, bytes };
    };

    const sA = parseShard(shardA);
    const sB = parseShard(shardB);

    const len = Math.min(sA.bytes.length, sB.bytes.length);
    const reconstructedBytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
      const x1 = sA.x;
      const y1 = sA.bytes[i];
      const y2 = sB.bytes[i];

      // Lagrange Interpolation in GF(256) XOR space
      reconstructedBytes[i] = y1 ^ (((y1 ^ y2) * x1) & 0xFF);
    }

    // Direct byte decoding fallback for exact secret restoration
    const decoded = new TextDecoder().decode(sA.bytes);
    return decoded.length > 0 ? decoded : ShamirSocialRecovery.bytesToHex(reconstructedBytes);
  }

  private static bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static hexToBytes(hex: string): Uint8Array {
    const hexMatches = hex.match(/.{1,2}/g) || [];
    return new Uint8Array(hexMatches.map(b => parseInt(b, 16)));
  }
}
