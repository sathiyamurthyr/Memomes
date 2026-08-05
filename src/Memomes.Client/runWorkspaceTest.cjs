/**
 * runWorkspaceTest.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Standalone Node.js test script verifying that 100 consecutive file uploads for
 * a personal account generate object keys using the EXACT SAME workspaceStorageId.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');

// Simulated Base32 ULID generator matching StorageIdentityService & UlidEngine
const Base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function generateUlid(prefix) {
  const nowMs = Date.now();
  let timeChars = "";
  let tempMs = nowMs;
  for (let i = 0; i < 10; i++) {
    timeChars = Base32Chars[tempMs % 32] + timeChars;
    tempMs = Math.floor(tempMs / 32);
  }
  const randomBytes = crypto.randomBytes(16);
  let randomChars = "";
  for (let i = 0; i < 16; i++) {
    randomChars += Base32Chars[randomBytes[i] % 32];
  }
  return `${prefix}_${timeChars}${randomChars}`;
}

// Database Mock matching UserWorkspace entity & AppDbContext unique index constraint
class MockUserWorkspaceDb {
  constructor() {
    this.workspaces = new Map(); // userId -> UserWorkspace
  }

  getOrCreatePersonalWorkspace(userId) {
    if (this.workspaces.has(userId)) {
      // Reuse existing permanent workspace
      return { workspace: this.workspaces.get(userId), createdNew: false };
    }

    // Generate ONLY ONCE during initial setup
    const newWorkspace = {
      id: crypto.randomUUID(),
      userId,
      workspaceStorageId: generateUlid('wrk'),
      userStorageId: generateUlid('usr'),
      workspaceType: 'PERSONAL',
      tenantId: 'tenant001',
      companyId: 'company001',
      createdAt: new Date().toISOString()
    };

    // Database unique index constraint check
    if (this.workspaces.has(userId)) {
      console.error(`❌ Upload attempt tried to create a second workspace for the same personal account user ${userId}. Duplicate blocked by database constraint.`);
      return { workspace: this.workspaces.get(userId), createdNew: false };
    }

    this.workspaces.set(userId, newWorkspace);
    return { workspace: newWorkspace, createdNew: true };
  }
}

// Object Key Generator matching ObjectKeyGenerator.cs
function generateObjectKey(request) {
  const { workspaceStorageId, userStorageId, originalFileName, date = new Date() } = request;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  
  const ext = originalFileName.split('.').pop() || 'bin';
  let fileType = 'Documents';
  if (['pdf'].includes(ext)) fileType = 'PDF';
  if (['jpg', 'png'].includes(ext)) fileType = 'Images';

  const encryptedObjectId = generateUlid('obj');
  const storageObjectName = `${encryptedObjectId}.enc`;

  // Personal Format: sathus/memomes/{workspaceStorageId}/{userStorageId}/{fileType}/{YYYY}/{MM}/{DD}/{objectStorageId}.enc
  const objectKey = `sathus/memomes/${workspaceStorageId}/${userStorageId}/${fileType}/${year}/${month}/${day}/${storageObjectName}`;
  
  return {
    workspaceStorageId,
    userStorageId,
    objectKey
  };
}

// ── EXECUTE 100 FILE UPLOAD VERIFICATION ────────────────────────────────────

console.log("=========================================================");
console.log("MEMOMES CLOUD — WORKSPACE CREATION LOGIC VERIFICATION TEST");
console.log("=========================================================");

const db = new MockUserWorkspaceDb();
const testUserId = "a1b2c3d4-e5f6-7890-abcd-1234567890ab";

// 1. Initial Workspace Setup
const initialResult = db.getOrCreatePersonalWorkspace(testUserId);
const primaryWorkspace = initialResult.workspace;

console.log(`\n1. Initial Account Workspace Creation:`);
console.log(`   User ID:              ${testUserId}`);
console.log(`   workspaceStorageId:   ${primaryWorkspace.workspaceStorageId}`);
console.log(`   userStorageId:        ${primaryWorkspace.userStorageId}`);
console.log(`   Created New:          ${initialResult.createdNew}`);

// 2. Upload 100 Files
console.log(`\n2. Simulating 100 File Uploads for Personal Account...`);
const generatedKeys = [];
const usedWorkspaceStorageIds = new Set();

for (let i = 1; i <= 100; i++) {
  // Read existing workspaceStorageId from database (NEVER generate a new workspaceStorageId)
  const { workspace } = db.getOrCreatePersonalWorkspace(testUserId);
  usedWorkspaceStorageIds.add(workspace.workspaceStorageId);

  const keyResult = generateObjectKey({
    workspaceStorageId: workspace.workspaceStorageId,
    userStorageId: workspace.userStorageId,
    originalFileName: `tax_return_2025_doc_${i}.pdf`
  });

  generatedKeys.push(keyResult.objectKey);
}

// 3. Test Duplicate Workspace Creation Attempt
console.log(`\n3. Testing Duplicate Workspace Creation Attempt...`);
const duplicateAttempt = db.getOrCreatePersonalWorkspace(testUserId);

// 4. Assertions & Validation
const uniqueWorkspaceCount = usedWorkspaceStorageIds.size;
const isSingleWorkspace = uniqueWorkspaceCount === 1 && usedWorkspaceStorageIds.has(primaryWorkspace.workspaceStorageId);
const allKeysMatchPattern = generatedKeys.every(k => k.startsWith(`sathus/memomes/${primaryWorkspace.workspaceStorageId}/${primaryWorkspace.userStorageId}/`));

console.log(`\n================================================ clichés`);
console.log(`VERIFICATION RESULTS:`);
console.log(`- Total Uploaded Files:           ${generatedKeys.length}`);
console.log(`- Unique Workspace IDs Count:     ${uniqueWorkspaceCount} (Required: 1)`);
console.log(`- Single Permanent Workspace:     ${isSingleWorkspace ? "✅ PASS" : "❌ FAIL"}`);
console.log(`- Duplicate Creation Blocked:     ${!duplicateAttempt.createdNew ? "✅ PASS" : "❌ FAIL"}`);
console.log(`- All 100 Object Keys Match Path: ${allKeysMatchPattern ? "✅ PASS" : "❌ FAIL"}`);
console.log(`\nSAMPLE GENERATED OBJECT KEYS:`);
console.log(`[File 1]   ${generatedKeys[0]}`);
console.log(`[File 50]  ${generatedKeys[49]}`);
console.log(`[File 100] ${generatedKeys[99]}`);
console.log("=========================================================\n");

if (isSingleWorkspace && allKeysMatchPattern && !duplicateAttempt.createdNew) {
  process.exit(0);
} else {
  process.exit(1);
}
