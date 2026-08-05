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
console.log('  STAR / FAVORITE FILES FEATURE QA TEST SUITE  ');
console.log('===========================================================\n');

// Clear localStorage before testing
localStorage.clear();

const { LocalVaultDb } = require('./src/utils/localVaultDb.ts');

console.log('--- TEST 1: Seed Files Initial Favorite Status ---');
const files = LocalVaultDb.seedInitialVaultFiles();
assert(Array.isArray(files) && files.length > 0, 'Seed files must be generated');
console.log(`✓ Seeded ${files.length} vault files`);

console.log('\n--- TEST 2: Toggle Favorite Status ---');
const targetFileId = files[0].id;
const isNowStar = LocalVaultDb.toggleFavorite(targetFileId);
assert.strictEqual(isNowStar, true, 'First toggle on unstarred file must return true');
console.log(`✓ Toggled file [${targetFileId}] isFavorite -> ${isNowStar}`);

// Read back from storage to confirm persistence
const updatedFiles = LocalVaultDb.getAllFiles();
const starredFile = updatedFiles.find(f => f.id === targetFileId);
assert.strictEqual(starredFile.isFavorite, true, 'starredFile.isFavorite must be true in storage');
console.log('✓ Verified favorite status persisted to LocalStorage');

console.log('\n--- TEST 3: Favorites Tab Filtering & Count Sync ---');
const favFiltered = updatedFiles.filter(f => f.isFavorite);
assert.strictEqual(favFiltered.length, 1, 'Filtered favorites must contain 1 file');
assert.strictEqual(favFiltered[0].id, targetFileId, 'Filtered favorite ID must match target file');
console.log(`✓ Favorites count badge = ${favFiltered.length}`);

console.log('\n--- TEST 4: Toggle Off Favorite Status ---');
const isUnstar = LocalVaultDb.toggleFavorite(targetFileId);
assert.strictEqual(isUnstar, false, 'Second toggle must return false');
const finalFiles = LocalVaultDb.getAllFiles();
const unstarredFile = finalFiles.find(f => f.id === targetFileId);
assert.strictEqual(unstarredFile.isFavorite, false, 'unstarredFile.isFavorite must be false');
assert.strictEqual(finalFiles.filter(f => f.isFavorite).length, 0, 'Favorites count must return to 0');
console.log('✓ Successfully unstarred file and verified count reset to 0');

console.log('\n===========================================================');
console.log('  ALL STAR / FAVORITE QA TESTS PASSED!  ');
console.log('===========================================================');
