import { UlidEngine } from './ulid';

export interface PersonalWorkspaceInfo {
  readonly userId: string;
  readonly workspaceStorageId: string;
  readonly userStorageId: string;
  workspaceType: 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE';
  countryCode: string;
  businessId?: string;
  tenantId: string;
  companyId: string;
  subscriptionTier?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

const WORKSPACE_STORAGE_KEY = 'memomes_user_workspace';

export class WorkspaceStore {
  /**
   * Helper to create an immutable workspace record (freezes workspaceStorageId and userStorageId)
   */
  private static makeImmutable(info: PersonalWorkspaceInfo): PersonalWorkspaceInfo {
    const copy = { ...info };
    Object.defineProperty(copy, 'workspaceStorageId', { writable: false, configurable: false });
    Object.defineProperty(copy, 'userStorageId', { writable: false, configurable: false });
    return Object.freeze(copy);
  }

  /**
   * Account Creation: Generates exactly ONE permanent Workspace Storage ID (wrk_...)
   * and User Storage ID (usr_...) during account creation.
   */
  static createAccountWorkspace(
    userId: string,
    countryCode: string = 'in',
    workspaceType: 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE' = 'PERSONAL'
  ): PersonalWorkspaceInfo {
    const normalizedKey = (userId || 'sathiya@memomes.com').toLowerCase().trim();

    // Check if account already exists
    const existing = this.findExistingWorkspace(normalizedKey);
    if (existing) {
      return existing;
    }

    // Generate new immutable storage IDs ONCE with required wrk_ and usr_ prefixes
    const rawWrk = UlidEngine.generate('wrk');
    const rawUsr = UlidEngine.generate('usr');

    const newWorkspace: PersonalWorkspaceInfo = {
      userId: normalizedKey,
      workspaceStorageId: rawWrk.startsWith('wrk_') ? rawWrk : `wrk_${rawWrk}`,
      userStorageId: rawUsr.startsWith('usr_') ? rawUsr : `usr_${rawUsr}`,
      workspaceType,
      countryCode: countryCode.toUpperCase().trim(),
      subscriptionTier: 'FREE',
      createdAt: new Date().toISOString()
    };
    if (workspaceType === 'ENTERPRISE') {
      newWorkspace.tenantId = 'tenant001';
      newWorkspace.companyId = 'company001';
    }

    const immutable = this.makeImmutable(newWorkspace);
    this.persistWorkspace(normalizedKey, immutable);
    console.info(`✨ Created permanent immutable storage identity for account ${normalizedKey}: workspaceStorageId=${immutable.workspaceStorageId}, userStorageId=${immutable.userStorageId}`);
    return immutable;
  }

  /**
   * Internal helper to scan persistent storage for existing account workspace
   */
  private static findExistingWorkspace(normalizedKey: string): PersonalWorkspaceInfo | null {
    const candidateKeys = [
      `${WORKSPACE_STORAGE_KEY}_${normalizedKey}`,
      `${WORKSPACE_STORAGE_KEY}_global`,
      `${WORKSPACE_STORAGE_KEY}_a1b2c3d4-e5f6-7890-abcd-1234567890ab`,
      WORKSPACE_STORAGE_KEY
    ];

    for (const key of candidateKeys) {
      try {
        const storedStr = localStorage.getItem(key);
        if (storedStr) {
          const parsed: PersonalWorkspaceInfo = JSON.parse(storedStr);
          if (parsed && parsed.workspaceStorageId && parsed.workspaceStorageId.startsWith('wrk_') && parsed.userStorageId && parsed.userStorageId.startsWith('usr_')) {
            if (!parsed.countryCode) parsed.countryCode = 'IN';
            return this.makeImmutable(parsed);
          }
        }
      } catch (e) {
        console.warn('[WorkspaceStore] Error reading workspace key:', key, e);
      }
    }
    return null;
  }

  /**
   * Persist workspace record to persistent storage
   */
  private static persistWorkspace(normalizedKey: string, workspace: PersonalWorkspaceInfo) {
    try {
      const serialized = JSON.stringify(workspace);
      localStorage.setItem(`${WORKSPACE_STORAGE_KEY}_${normalizedKey}`, serialized);
      if (normalizedKey === 'sathiya@memomes.com' || normalizedKey === 'default') {
        localStorage.setItem(`${WORKSPACE_STORAGE_KEY}_global`, serialized);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, serialized);
      }
    } catch (e) {
      console.error('[WorkspaceStore] Failed to persist workspace', e);
    }
  }

  /**
   * Retrieves the single permanent personal workspace for the specified user.
   * Reads existing IDs from storage. Never generates new ones if an account exists.
   */
  static getPersonalWorkspace(userId: string = 'sathiya@memomes.com'): PersonalWorkspaceInfo {
    const normalizedKey = (userId || 'sathiya@memomes.com').toLowerCase().trim();
    const existing = this.findExistingWorkspace(normalizedKey);
    if (existing) {
      return existing;
    }

    // Default primary fallback for sathiya@memomes.com or initial boot
    if (normalizedKey === 'sathiya@memomes.com') {
      const primaryDefault: PersonalWorkspaceInfo = {
        userId: 'sathiya@memomes.com',
        workspaceStorageId: 'wrk_01H8XMEMOMESCLOUDVAULT01',
        userStorageId: 'usr_01H8XMEMOMESCLOUDVAULT01',
        workspaceType: 'PERSONAL',
        countryCode: 'IN',
        createdAt: '2026-08-01T00:00:00.000Z'
      };
      const immutable = this.makeImmutable(primaryDefault);
      this.persistWorkspace('sathiya@memomes.com', immutable);
      return immutable;
    }

    // For any new user, create their permanent workspace identity once
    return this.createAccountWorkspace(normalizedKey);
  }

  /**
   * Attempted mutation guard. Throws error if any caller tries to alter workspaceStorageId or userStorageId.
   */
  static updateProfileInfo(
    userId: string,
    updates: Partial<Omit<PersonalWorkspaceInfo, 'workspaceStorageId' | 'userStorageId'>> & {
      workspaceStorageId?: string;
      userStorageId?: string;
    }
  ): PersonalWorkspaceInfo {
    const current = this.getPersonalWorkspace(userId);

    if (
      (updates.workspaceStorageId && updates.workspaceStorageId !== current.workspaceStorageId) ||
      (updates.userStorageId && updates.userStorageId !== current.userStorageId)
    ) {
      throw new Error(`[ImmutableStorageIdentity] Violation: Attempted to mutate immutable storage IDs for account ${userId}!`);
    }

    const updated: PersonalWorkspaceInfo = {
      ...current,
      ...updates,
      workspaceStorageId: current.workspaceStorageId,
      userStorageId: current.userStorageId,
      updatedAt: new Date().toISOString()
    };

    const immutable = this.makeImmutable(updated);
    this.persistWorkspace(current.userId, immutable);
    return immutable;
  }

  /**
   * Account Lifecycle Actions (Login, Logout, Password Reset, Email Change, Country Change, etc.)
   * NEVER change workspaceStorageId or userStorageId.
   */
  static handleLogin(userId: string): PersonalWorkspaceInfo {
    return this.getPersonalWorkspace(userId);
  }

  static handleLogout(userId: string): void {
    // Session token cleared, but immutable workspace IDs remain intact in persistent storage
  }

  static handlePasswordReset(userId: string): PersonalWorkspaceInfo {
    return this.getPersonalWorkspace(userId);
  }

  static changeUserCountry(userId: string, newCountryCode: string): PersonalWorkspaceInfo {
    return this.updateProfileInfo(userId, { countryCode: newCountryCode.toUpperCase().trim() });
  }

  static changeUserEmail(oldUserId: string, newEmail: string): PersonalWorkspaceInfo {
    const current = this.getPersonalWorkspace(oldUserId);
    const newKey = newEmail.toLowerCase().trim();

    const updated: PersonalWorkspaceInfo = {
      ...current,
      userId: newKey,
      workspaceStorageId: current.workspaceStorageId,
      userStorageId: current.userStorageId,
      updatedAt: new Date().toISOString()
    };

    const immutable = this.makeImmutable(updated);
    this.persistWorkspace(newKey, immutable);
    this.resetWorkspace(oldUserId);
    return immutable;
  }

  static upgradeSubscription(userId: string, tier: string): PersonalWorkspaceInfo {
    return this.updateProfileInfo(userId, { subscriptionTier: tier });
  }

  /**
   * Reset workspace storage (for testing purposes)
   */
  static resetWorkspace(userId: string = 'sathiya@memomes.com') {
    const normalizedKey = (userId || 'sathiya@memomes.com').toLowerCase().trim();
    localStorage.removeItem(`${WORKSPACE_STORAGE_KEY}_${normalizedKey}`);
    localStorage.removeItem(`${WORKSPACE_STORAGE_KEY}_global`);
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  }
}
