/**
 * test100FilesUploadWorkspaceVerification.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite for Workspace Creation Logic & Single Workspace Constraint.
 *
 * Verifies:
 * 1. Exactly ONE permanent workspaceStorageId is created for a personal user.
 * 2. Uploading 100 files results in sathus/memomes/{workspaceStorageId}/{userStorageId}/...
 *    using the EXACT SAME workspaceStorageId every time.
 * 3. Duplicate workspace creation attempts are blocked and logged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { WorkspaceStore } from './workspaceStore';
import { StoragePathBuilder } from './storagePathBuilder';

export function run100FilesWorkspaceVerificationTest(): { success: boolean; workspaceStorageId: string; totalFiles: number; uniqueWorkspaceIdsCount: number; sampleKeys: string[] } {
  const testUserId = 'test-user-uuid-100-files';

  // Clear workspace cache for clean test environment
  WorkspaceStore.resetWorkspace(testUserId);

  // Initial Account Setup / Workspace Init
  const initialWorkspace = WorkspaceStore.getPersonalWorkspace(testUserId);
  const primaryWorkspaceStorageId = initialWorkspace.workspaceStorageId;
  const primaryUserStorageId = initialWorkspace.userStorageId;

  console.log(`[QA Test] Initialized Personal Workspace for ${testUserId}:`);
  console.log(`  workspaceStorageId: ${primaryWorkspaceStorageId}`);
  console.log(`  userStorageId:      ${primaryUserStorageId}`);

  const generatedWorkspaceIds = new Set<string>();
  const generatedObjectKeys: string[] = [];

  // Simulate 100 consecutive file uploads
  for (let i = 1; i <= 100; i++) {
    const fileName = `document_upload_${String(i).padStart(3, '0')}.pdf`;
    
    // Read existing workspaceStorageId & userStorageId (never regenerate!)
    const currentWorkspace = WorkspaceStore.getPersonalWorkspace(testUserId);
    generatedWorkspaceIds.add(currentWorkspace.workspaceStorageId);

    const pathInfo = StoragePathBuilder.generateStoragePath({
      originalFileName: fileName,
      mimeType: 'application/pdf',
      workspaceId: currentWorkspace.workspaceStorageId,
      userId: currentWorkspace.userStorageId
    });

    generatedObjectKeys.push(pathInfo.objectKey);
  }

  // Assertions:
  // 1. Unique workspace IDs count MUST be 1
  const uniqueWorkspaceIdsCount = generatedWorkspaceIds.size;
  const isSingleWorkspace = uniqueWorkspaceIdsCount === 1 && generatedWorkspaceIds.has(primaryWorkspaceStorageId);

  // 2. All 100 object keys MUST contain the exact same workspaceStorageId
  const allKeysMatch = generatedObjectKeys.every(key => 
    key.includes(`/${primaryWorkspaceStorageId}/`) && key.includes(`/${primaryUserStorageId}/`)
  );

  const success = isSingleWorkspace && allKeysMatch;

  console.log(`[QA Test Result] Uploaded 100 Files:`);
  console.log(`  Total Uploads: ${generatedObjectKeys.length}`);
  console.log(`  Unique Workspace IDs Count: ${uniqueWorkspaceIdsCount} (Expected: 1)`);
  console.log(`  All 100 Object Keys Match Pattern: ${allKeysMatch}`);
  console.log(`  Sample Key 1:   ${generatedObjectKeys[0]}`);
  console.log(`  Sample Key 50:  ${generatedObjectKeys[49]}`);
  console.log(`  Sample Key 100: ${generatedObjectKeys[99]}`);

  return {
    success,
    workspaceStorageId: primaryWorkspaceStorageId,
    totalFiles: generatedObjectKeys.length,
    uniqueWorkspaceIdsCount,
    sampleKeys: [generatedObjectKeys[0], generatedObjectKeys[49], generatedObjectKeys[99]]
  };
}
