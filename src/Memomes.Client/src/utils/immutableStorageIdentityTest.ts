/**
 * immutableStorageIdentityTest.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Test Suite for Immutable Storage Identities in Memomes Cloud.
 *
 * Verifies:
 * 1. Account creation generates exactly one wrk_ and usr_ storage ID.
 * 2. Immutable fields are frozen and cannot be overwritten or mutated.
 * 3. Logins, logouts, password resets, profile updates, phone changes, email changes,
 *    country changes, and subscription upgrades NEVER alter workspaceStorageId or userStorageId.
 * 4. Storage paths match standard Personal and Enterprise formats:
 *    - Personal: sathus/memomes/{countryCode}/personal/{wrk_Id}/{usr_Id}/{category}/{yyyy}/{MM}/{dd}/obj_xxxx.enc
 *    - Enterprise: sathus/memomes/{countryCode}/enterprise/{tenantId}/{companyId}/{wrk_Id}/{usr_Id}/{category}/{yyyy}/{MM}/{dd}/obj_xxxx.enc
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { WorkspaceStore } from './workspaceStore';
import { StoragePathBuilder } from './storagePathBuilder';

export interface TestResult {
  success: boolean;
  userEmail: string;
  workspaceStorageId: string;
  userStorageId: string;
  personalPathSample: string;
  enterprisePathSample: string;
  lifecycleStepsCount: number;
  allStepsPreservedSameIds: boolean;
  mutationGuardBlockedInvalidEdit: boolean;
  errors: string[];
}

export function runImmutableStorageIdentityTestSuite(): TestResult {
  const errors: string[] = [];
  const testEmail = `qa-user-${Date.now()}@memomes.com`;

  // 1. Clear environment for clean test run
  WorkspaceStore.resetWorkspace(testEmail);

  // 2. Account Creation
  const account = WorkspaceStore.createAccountWorkspace(testEmail, 'in', 'PERSONAL');
  const initialWrkId = account.workspaceStorageId;
  const initialUsrId = account.userStorageId;

  if (!initialWrkId || !initialWrkId.startsWith('wrk_')) {
    errors.push(`Invalid workspaceStorageId format: expected wrk_ prefix, got: ${initialWrkId}`);
  }
  if (!initialUsrId || !initialUsrId.startsWith('usr_')) {
    errors.push(`Invalid userStorageId format: expected usr_ prefix, got: ${initialUsrId}`);
  }

  // 3. Verify Account Lifecycle Operations Preserve Same IDs
  const history: { step: string; wrkId: string; usrId: string }[] = [];

  // Step 1: Login
  const loginWs = WorkspaceStore.handleLogin(testEmail);
  history.push({ step: 'Login 1', wrkId: loginWs.workspaceStorageId, usrId: loginWs.userStorageId });

  // Step 2: Update Profile (Phone)
  const profileWs = WorkspaceStore.updateProfileInfo(testEmail, { phone: '+91-9876543210' });
  history.push({ step: 'Update Phone', wrkId: profileWs.workspaceStorageId, usrId: profileWs.userStorageId });

  // Step 3: Change Country
  const countryWs = WorkspaceStore.changeUserCountry(testEmail, 'us');
  history.push({ step: 'Change Country', wrkId: countryWs.workspaceStorageId, usrId: countryWs.userStorageId });

  // Step 4: Upgrade Subscription
  const subWs = WorkspaceStore.upgradeSubscription(testEmail, 'ENTERPRISE_VIP');
  history.push({ step: 'Upgrade Subscription', wrkId: subWs.workspaceStorageId, usrId: subWs.userStorageId });

  // Step 5: Password Reset
  const pwdWs = WorkspaceStore.handlePasswordReset(testEmail);
  history.push({ step: 'Password Reset', wrkId: pwdWs.workspaceStorageId, usrId: pwdWs.userStorageId });

  // Step 6: Logout & Re-login
  WorkspaceStore.handleLogout(testEmail);
  const reloginWs = WorkspaceStore.handleLogin(testEmail);
  history.push({ step: 'Re-login after Logout', wrkId: reloginWs.workspaceStorageId, usrId: reloginWs.userStorageId });

  // Step 7: Change Email
  const newEmail = `qa-user-updated-${Date.now()}@memomes.com`;
  const emailWs = WorkspaceStore.changeUserEmail(testEmail, newEmail);
  history.push({ step: 'Change Email', wrkId: emailWs.workspaceStorageId, usrId: emailWs.userStorageId });

  // Check all history steps
  const allStepsPreservedSameIds = history.every(
    h => h.wrkId === initialWrkId && h.usrId === initialUsrId
  );

  if (!allStepsPreservedSameIds) {
    errors.push(`Account lifecycle altered immutable storage IDs! History: ${JSON.stringify(history)}`);
  }

  // 4. Immutability Violation Guard Test
  let mutationGuardBlockedInvalidEdit = false;
  try {
    WorkspaceStore.updateProfileInfo(newEmail, {
      workspaceStorageId: 'wrk_HACKED_INVALID_ID'
    } as any);
  } catch (e: any) {
    if (e && e.message && e.message.includes('[ImmutableStorageIdentity] Violation')) {
      mutationGuardBlockedInvalidEdit = true;
    }
  }

  if (!mutationGuardBlockedInvalidEdit) {
    errors.push(`Immutability violation guard failed to throw exception on invalid ID mutation attempt!`);
  }

  // 5. Storage Path Pattern Verification
  const date = new Date('2026-08-05T12:00:00Z');

  // Personal Path Test
  const personalPathResult = StoragePathBuilder.generateStoragePath({
    workspaceType: 'PERSONAL',
    countryCode: 'us',
    userId: newEmail,
    workspaceId: initialWrkId,
    originalFileName: 'Tax_Document.pdf',
    mimeType: 'application/pdf',
    date
  });

  const expectedPersonalPrefix = `sathus/memomes/us/personal/${initialWrkId}/${initialUsrId}/PDF/2026/08/05/obj_`;
  if (!personalPathResult.objectKey.startsWith(expectedPersonalPrefix) || !personalPathResult.objectKey.endsWith('.enc')) {
    errors.push(`Personal storage path mismatch: expected prefix "${expectedPersonalPrefix}", got: ${personalPathResult.objectKey}`);
  }

  // Enterprise Path Test
  const enterprisePathResult = StoragePathBuilder.generateStoragePath({
    workspaceType: 'ENTERPRISE',
    countryCode: 'us',
    tenantId: 'tenant001',
    companyId: 'company001',
    userId: newEmail,
    workspaceId: initialWrkId,
    originalFileName: 'Quarterly_Report.pdf',
    mimeType: 'application/pdf',
    date
  });

  const expectedEnterprisePrefix = `sathus/memomes/us/enterprise/tenant001/company001/${initialWrkId}/${initialUsrId}/PDF/2026/08/05/obj_`;
  if (!enterprisePathResult.objectKey.startsWith(expectedEnterprisePrefix) || !enterprisePathResult.objectKey.endsWith('.enc')) {
    errors.push(`Enterprise storage path mismatch: expected prefix "${expectedEnterprisePrefix}", got: ${enterprisePathResult.objectKey}`);
  }

  // Clean up test workspace
  WorkspaceStore.resetWorkspace(newEmail);

  const success = errors.length === 0;

  console.log(`[ImmutableStorageIdentity Test Suite] Result: ${success ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`  User Email: ${newEmail}`);
  console.log(`  workspaceStorageId: ${initialWrkId}`);
  console.log(`  userStorageId: ${initialUsrId}`);
  console.log(`  Personal Path Sample: ${personalPathResult.objectKey}`);
  console.log(`  Enterprise Path Sample: ${enterprisePathResult.objectKey}`);
  console.log(`  Lifecycle Steps Tested: ${history.length}`);
  console.log(`  Immutability Guard Blocked Mutation: ${mutationGuardBlockedInvalidEdit}`);

  return {
    success,
    userEmail: newEmail,
    workspaceStorageId: initialWrkId,
    userStorageId: initialUsrId,
    personalPathSample: personalPathResult.objectKey,
    enterprisePathSample: enterprisePathResult.objectKey,
    lifecycleStepsCount: history.length,
    allStepsPreservedSameIds,
    mutationGuardBlockedInvalidEdit,
    errors
  };
}
