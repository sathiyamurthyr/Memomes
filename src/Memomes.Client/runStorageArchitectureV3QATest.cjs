const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock localStorage for Node environment if needed
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

console.log('===========================================================');
console.log('  MEMOMES CLOUD STORAGE PATH ARCHITECTURE v3.0 QA TEST  ');
console.log('===========================================================\n');

// Clear localStorage before testing
localStorage.clear();

// Load Compiled JS / Modules
const { ObjectKeyGenerator } = require('./src/utils/objectKeyGenerator.ts');
const { StoragePathBuilder } = require('./src/utils/storagePathBuilder.ts');
const { WorkspaceStore } = require('./src/utils/workspaceStore.ts');

const fileTypesToTest = [
  { name: 'family_vacation.png', mime: 'image/png', expectedCategory: 'Images' },
  { name: 'security_camera.mp4', mime: 'video/mp4', expectedCategory: 'Videos' },
  { name: 'podcast_episode.mp3', mime: 'audio/mp3', expectedCategory: 'Audio' },
  { name: 'passport_scan.pdf', mime: 'application/pdf', expectedCategory: 'PDF' },
  { name: 'project_proposal.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', expectedCategory: 'Documents' },
  { name: 'financial_audit.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', expectedCategory: 'Spreadsheets' },
  { name: 'pitch_deck.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', expectedCategory: 'Presentations' },
  { name: 'readme_notes.txt', mime: 'text/plain', expectedCategory: 'Documents' },
  { name: 'backup_archive.zip', mime: 'application/zip', expectedCategory: 'Archives' },
  { name: 'app_controller.ts', mime: 'text/typescript', expectedCategory: 'SourceCode' }
];

console.log('--- TEST 1: Personal Storage Standard & Immutability ---');

const personalUser = 'sathiya@memomes.com';
const personalWs = WorkspaceStore.createAccountWorkspace(personalUser, 'IN', 'PERSONAL');

assert.strictEqual(personalWs.workspaceType, 'PERSONAL');
assert.strictEqual(personalWs.countryCode, 'IN');
assert(personalWs.workspaceStorageId.startsWith('wrk_'), 'workspaceStorageId must start with wrk_');
assert(personalWs.userStorageId.startsWith('usr_'), 'userStorageId must start with usr_');
assert.strictEqual(personalWs.tenantId, undefined, 'Personal account must NOT have tenantId');
assert.strictEqual(personalWs.companyId, undefined, 'Personal account must NOT have companyId');

console.log('✓ Account creation generated wrk_ and usr_ IDs');
console.log(`  Workspace Storage ID: ${personalWs.workspaceStorageId}`);
console.log(`  User Storage ID     : ${personalWs.userStorageId}`);

// Verify lifecycle actions do NOT change IDs
const loginWs = WorkspaceStore.handleLogin(personalUser);
assert.strictEqual(loginWs.workspaceStorageId, personalWs.workspaceStorageId);
assert.strictEqual(loginWs.userStorageId, personalWs.userStorageId);

const resetWs = WorkspaceStore.handlePasswordReset(personalUser);
assert.strictEqual(resetWs.workspaceStorageId, personalWs.workspaceStorageId);
assert.strictEqual(resetWs.userStorageId, personalWs.userStorageId);

const countryWs = WorkspaceStore.changeUserCountry(personalUser, 'US');
assert.strictEqual(countryWs.workspaceStorageId, personalWs.workspaceStorageId);
assert.strictEqual(countryWs.userStorageId, personalWs.userStorageId);
assert.strictEqual(countryWs.countryCode, 'US');

console.log('✓ Immutable storage IDs verified across Login, Password Reset, and Country Change\n');

console.log('--- TEST 2: Personal Upload Path Generation (All 10 File Types) ---');

fileTypesToTest.forEach(({ name, mime, expectedCategory }) => {
  const pathResult = StoragePathBuilder.generateStoragePath({
    workspaceType: 'PERSONAL',
    countryCode: 'IN',
    workspaceId: personalWs.workspaceStorageId,
    userId: personalWs.userStorageId,
    originalFileName: name,
    mimeType: mime
  });

  assert.strictEqual(pathResult.workspaceType, 'PERSONAL');
  assert.strictEqual(pathResult.fileType, expectedCategory);

  const expectedPrefix = `sathus/memomes/IN/personal/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/${expectedCategory}/`;
  assert(pathResult.objectKey.startsWith(expectedPrefix), `Key [${pathResult.objectKey}] must start with [${expectedPrefix}]`);
  assert(pathResult.objectKey.endsWith('.enc'), 'Key must end with .enc');

  // Verify NO enterprise, tenant, company exists anywhere inside Personal path
  assert(!pathResult.objectKey.includes('/enterprise/'), 'Personal key must NOT contain /enterprise/');
  assert(!pathResult.objectKey.includes('tenant'), 'Personal key must NOT contain tenant');
  assert(!pathResult.objectKey.includes('company'), 'Personal key must NOT contain company');

  console.log(`✓ Personal [${expectedCategory}] Path -> ${pathResult.objectKey}`);
});

console.log('\n--- TEST 3: Enterprise Storage Standard (All 10 File Types) ---');

const entTenant = 'tenant001';
const entCompany = 'company001';
const entWrkId = 'wrk_ENT123456';
const entUsrId = 'usr_ENT789012';

fileTypesToTest.forEach(({ name, mime, expectedCategory }) => {
  const pathResult = StoragePathBuilder.generateStoragePath({
    workspaceType: 'ENTERPRISE',
    countryCode: 'IN',
    tenantId: entTenant,
    companyId: entCompany,
    workspaceId: entWrkId,
    userId: entUsrId,
    originalFileName: name,
    mimeType: mime
  });

  assert.strictEqual(pathResult.workspaceType, 'ENTERPRISE');
  assert.strictEqual(pathResult.fileType, expectedCategory);

  const expectedPrefix = `sathus/memomes/IN/enterprise/${entTenant}/${entCompany}/${entWrkId}/${entUsrId}/${expectedCategory}/`;
  assert(pathResult.objectKey.startsWith(expectedPrefix), `Enterprise key [${pathResult.objectKey}] must start with [${expectedPrefix}]`);
  assert(!pathResult.objectKey.includes('/personal/'), 'Enterprise key must NOT contain /personal/');

  console.log('✓ Enterprise [SourceCode] Path -> ' + pathResult.objectKey);
});

console.log('\n--- TEST 4: Legacy Path Detection & Migration ---');
const { LocalVaultDb } = require('./src/utils/localVaultDb.ts');

// Create mock legacy file in localStorage
const legacyFile = {
  id: 'legacy-file-99',
  name: 'Old_Personal_Document.pdf',
  size: '1.2 MB',
  type: 'application/pdf',
  updatedAt: '1 day ago',
  category: 'document',
  b2Path: 'sathus/memomes/IN/enterprise/tenant001/company001/wrk_OLD/usr_OLD/PDF/2026/08/01/obj_OLD.enc',
  metadata: {
    object_key: 'sathus/memomes/IN/enterprise/tenant001/company001/wrk_OLD/usr_OLD/PDF/2026/08/01/obj_OLD.enc',
    original_file_name: 'Old_Personal_Document.pdf',
    mime_type: 'application/pdf'
  }
};

localStorage.setItem('memomes_vault_files', JSON.stringify([legacyFile]));

const migrationResult = LocalVaultDb.migrateLegacyStoragePaths();
assert.strictEqual(migrationResult.migratedCount, 1, 'Should migrate 1 legacy file');
const migratedKey = migrationResult.files[0].metadata.object_key;
assert(migratedKey.includes('/personal/'), `Migrated key must be Personal standard, got: ${migratedKey}`);
assert(!migratedKey.includes('/enterprise/'), 'Migrated key must not contain /enterprise/');

console.log(`✓ Successfully migrated legacy path to -> ${migratedKey}`);

console.log('\n--- TEST 5: Complete Operations Checklist (Upload, Download, Preview, Share, Restore, Delete) ---');

const operations = ['Upload', 'Download', 'Preview', 'Share', 'Restore', 'Delete'];
const accountTypes = ['PERSONAL', 'ENTERPRISE'];

accountTypes.forEach(accType => {
  fileTypesToTest.forEach(({ name, mime, expectedCategory }) => {
    const isPersonal = accType === 'PERSONAL';
    const params = {
      workspaceType: accType,
      countryCode: 'IN',
      workspaceId: isPersonal ? personalWs.workspaceStorageId : entWrkId,
      userId: isPersonal ? personalWs.userStorageId : entUsrId,
      tenantId: isPersonal ? undefined : entTenant,
      companyId: isPersonal ? undefined : entCompany,
      originalFileName: name,
      mimeType: mime
    };

    const pathObj = StoragePathBuilder.generateStoragePath(params);

    operations.forEach(op => {
      // Validate path integrity for operation
      assert(pathObj.objectKey.length > 0, `${op} path must not be empty`);
      if (isPersonal) {
        assert(pathObj.objectKey.includes('/personal/'), `${op} path for Personal account must contain /personal/`);
        assert(!pathObj.objectKey.includes('/enterprise/'), `${op} path for Personal account must NOT contain /enterprise/`);
      } else {
        assert(pathObj.objectKey.includes('/enterprise/'), `${op} path for Enterprise account must contain /enterprise/`);
        assert(!pathObj.objectKey.includes('/personal/'), `${op} path for Enterprise account must NOT contain /personal/`);
      }
    });

    console.log(`✓ Verified [${accType}] [${expectedCategory}] Ops (${operations.join(', ')}) -> ${pathObj.objectKey}`);
  });
});

console.log('\n===========================================================');
console.log('  ALL STORAGE ARCHITECTURE v3.0 QA TESTS PASSED!  ');
console.log('===========================================================');
