/**
 * userPreferencesStore.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — SMART USER PREFERENCES STORE
 *
 * Stores user preferences for duplicate file handling in localStorage:
 * - duplicateHandlingMode: 'ALWAYS_ASK' | 'SKIP_EXACT' | 'REPLACE_EXISTING' | 'CREATE_VERSION' | 'KEEP_BOTH'
 * - rememberChoice: boolean
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type DuplicateHandlingMode =
  | 'ALWAYS_ASK'
  | 'SKIP_EXACT'
  | 'REPLACE_EXISTING'
  | 'CREATE_VERSION'
  | 'KEEP_BOTH';

export interface UserPreferences {
  duplicateHandlingMode: DuplicateHandlingMode;
  rememberChoice: boolean;
  theme: 'dark' | 'light';
  autoSyncB2: boolean;
}

const PREFERENCES_STORAGE_KEY = 'memomes_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  duplicateHandlingMode: 'ALWAYS_ASK',
  rememberChoice: false,
  theme: 'dark',
  autoSyncB2: true
};

export class UserPreferencesStore {
  static getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('[UserPreferencesStore] Error reading preferences', e);
    }
    return DEFAULT_PREFERENCES;
  }

  static updatePreferences(updated: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const newPrefs = { ...current, ...updated };
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newPrefs));
    } catch (e) {
      console.error('[UserPreferencesStore] Error writing preferences', e);
    }
    return newPrefs;
  }

  static resetPreferences(): UserPreferences {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    return DEFAULT_PREFERENCES;
  }
}
