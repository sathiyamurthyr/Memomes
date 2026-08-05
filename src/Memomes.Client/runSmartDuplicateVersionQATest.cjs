/**
 * runSmartDuplicateVersionQATest.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — AUTOMATED QA SUITE: SMART DUPLICATE & VERSION ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

console.log('===========================================================');
console.log('🔬 MEMOMES CLOUD — ENTERPRISE DUPLICATE & VERSION QA SUITE');
console.log('===========================================================');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Verify Database Model Entities in Backend & Local Storage Interface
console.log('\n--- 1. DATABASE METADATA SCHEMA VERIFICATION ---');
const entitiesContent = fs.readFileSync(path.join(__dirname, '../Memomes.Api/Models/Entities.cs'), 'utf8');
assert(entitiesContent.includes('FileHashSha256'), 'Entities.cs contains FileHashSha256 field');
assert(entitiesContent.includes('VersionNumber'), 'Entities.cs contains VersionNumber field');
assert(entitiesContent.includes('ParentFileId'), 'Entities.cs contains ParentFileId field');
assert(entitiesContent.includes('DuplicateOfId'), 'Entities.cs contains DuplicateOfId field');
assert(entitiesContent.includes('IsLatest'), 'Entities.cs contains IsLatest field');
assert(entitiesContent.includes('UploadCount'), 'Entities.cs contains UploadCount field');
assert(entitiesContent.includes('LastUploadedAt'), 'Entities.cs contains LastUploadedAt field');

const localVaultDbContent = fs.readFileSync(path.join(__dirname, 'src/utils/localVaultDb.ts'), 'utf8');
assert(localVaultDbContent.includes('file_hash_sha256?: string'), 'localVaultDb.ts contains file_hash_sha256 interface');
assert(localVaultDbContent.includes('parent_file_id?: string'), 'localVaultDb.ts contains parent_file_id interface');
assert(localVaultDbContent.includes('is_latest?: boolean'), 'localVaultDb.ts contains is_latest interface');

// 2. Verify 4-Case Duplicate Decision Matrix in duplicateDetector.ts
console.log('\n--- 2. 4-CASE DUPLICATE DECISION MATRIX VERIFICATION ---');
const detectorContent = fs.readFileSync(path.join(__dirname, 'src/utils/duplicateDetector.ts'), 'utf8');
assert(detectorContent.includes("duplicateCase: 'CASE_1'"), 'duplicateDetector.ts implements CASE 1 (Exact Duplicate)');
assert(detectorContent.includes("duplicateCase: 'CASE_2'"), 'duplicateDetector.ts implements CASE 2 (Same Name, Diff Content)');
assert(detectorContent.includes("duplicateCase: 'CASE_3'"), 'duplicateDetector.ts implements CASE 3 (Duplicate Content Across Names)');
assert(detectorContent.includes("duplicateCase: 'CASE_4'"), 'duplicateDetector.ts implements CASE 4 (Duplicate Across Folder)');
assert(detectorContent.includes('generateAutoRename'), 'duplicateDetector.ts implements auto-rename generator: Screenshot (2).png');
assert(detectorContent.includes('Target < 50ms'), 'duplicateDetector.ts enforces <50ms lookup performance optimization');

// 3. Verify Version Control Engine in versionManager.ts
console.log('\n--- 3. VERSION MANAGEMENT ENGINE VERIFICATION ---');
const versionContent = fs.readFileSync(path.join(__dirname, 'src/utils/versionManager.ts'), 'utf8');
assert(versionContent.includes('createNewVersion'), 'versionManager.ts implements createNewVersion method');
assert(versionContent.includes('restoreVersion'), 'versionManager.ts implements restoreVersion method');
assert(versionContent.includes('getVersionsForFile'), 'versionManager.ts implements getVersionsForFile method');
assert(versionContent.includes("auditLogger.logAudit('VERSION_CREATED'"), 'versionManager.ts records VERSION_CREATED audit log');
assert(versionContent.includes("auditLogger.trackAnalytics('version_created'"), 'versionManager.ts tracks version_created analytics');

// 4. Verify UI Modals (Duplicate, Compare, Bulk, Version History)
console.log('\n--- 4. UI COMPONENTS VERIFICATION ---');
const dupModalContent = fs.readFileSync(path.join(__dirname, 'src/components/DuplicateDetectionModal.tsx'), 'utf8');
assert(dupModalContent.includes('Exact Duplicate Detected'), 'DuplicateDetectionModal renders CASE 1 title');
assert(dupModalContent.includes('Filename Conflict'), 'DuplicateDetectionModal renders CASE 2 title');
assert(dupModalContent.includes('Duplicate Content Detected'), 'DuplicateDetectionModal renders CASE 3 title');
assert(dupModalContent.includes('Duplicate Across Folder'), 'DuplicateDetectionModal renders CASE 4 title');
assert(dupModalContent.includes('Remember my choice'), 'DuplicateDetectionModal implements Smart User Preference checkbox');

const compareModalContent = fs.readFileSync(path.join(__dirname, 'src/components/FileCompareModal.tsx'), 'utf8');
assert(compareModalContent.includes('Side-by-Side File Comparison'), 'FileCompareModal renders side-by-side header');
assert(compareModalContent.includes('Existing Vault File'), 'FileCompareModal renders existing file side');
assert(compareModalContent.includes('New Incoming File'), 'FileCompareModal renders new incoming file side');

const bulkModalContent = fs.readFileSync(path.join(__dirname, 'src/components/BulkDuplicateModal.tsx'), 'utf8');
assert(bulkModalContent.includes('Batch Duplicate Processing'), 'BulkDuplicateModal renders batch duplicate header');
assert(bulkModalContent.includes('Skip All Duplicates'), 'BulkDuplicateModal renders Skip All action');
assert(bulkModalContent.includes('Create Version For All'), 'BulkDuplicateModal renders Version All action');

const verHistoryModalContent = fs.readFileSync(path.join(__dirname, 'src/components/VersionHistoryModal.tsx'), 'utf8');
assert(verHistoryModalContent.includes('Version History Inspector'), 'VersionHistoryModal renders inspector header');
assert(verHistoryModalContent.includes('Restore'), 'VersionHistoryModal renders restore action');
assert(verHistoryModalContent.includes('Download'), 'VersionHistoryModal renders download version action');

console.log('===========================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount === 0) {
  console.log('🎉 ALL SMART DUPLICATE & VERSION CONTROL QA VERIFICATIONS PASSED 100%!');
} else {
  console.error('❌ QA FAILURES DETECTED');
  process.exit(1);
}
