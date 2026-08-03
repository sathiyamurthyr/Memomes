/**
 * ULID (Universally Unique Lexicographically Sortable Identifier) Generator
 * 
 * Generates 26-character Crockford Base32 timestamp-ordered unique object identifiers.
 * Example: obj_01K5F7VJX8M2Q4R6N9ABCD1234
 */

const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export class UlidEngine {
  static generate(prefix = 'obj'): string {
    const now = Date.now();
    let timeChars = '';

    let time = now;
    for (let i = 9; i >= 0; i--) {
      const mod = time % 32;
      timeChars = CROCKFORD_BASE32[mod] + timeChars;
      time = Math.floor(time / 32);
    }

    let randomChars = '';
    for (let i = 0; i < 16; i++) {
      const rand = Math.floor(Math.random() * 32);
      randomChars += CROCKFORD_BASE32[rand];
    }

    const ulid = `${timeChars}${randomChars}`;
    return prefix ? `${prefix}_${ulid}` : ulid;
  }
}
