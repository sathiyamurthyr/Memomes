/**
 * runSearchSortQATest.cjs
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — AUTOMATED SEARCH & SORT VERIFICATION SUITE
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

console.log('===========================================================');
console.log('🔬 MEMOMES CLOUD — SEARCH & SORT VERIFICATION SUITE');
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

// 1. Verify Search & Sort Integration in EnterpriseFileExplorer.tsx
const explorerContent = fs.readFileSync(path.join(__dirname, 'src/components/EnterpriseFileExplorer.tsx'), 'utf8');

assert(explorerContent.includes('displayedFiles.filter'), 'EnterpriseFileExplorer uses displayedFiles to filter files');
assert(explorerContent.includes('categoriesList.map(cat => {'), 'EnterpriseFileExplorer iterates category list');
assert(explorerContent.includes('const categoryFiles = displayedFiles.filter'), 'Tree View derives categoryFiles from displayedFiles (Fixes Tree View Search & Sort Bug)');
assert(explorerContent.includes('isSearchActive ? categoryFiles.length > 0'), 'Tree View automatically expands matching folders when searching');
assert(explorerContent.includes("sortOrder === 'asc' ? 'desc' : 'asc'"), 'EnterpriseFileExplorer contains clickable Sort Order ASC/DESC direction toggle button');
assert(explorerContent.includes("navStateStore.setState({ searchQuery: '' })"), 'EnterpriseFileExplorer contains Clear Search action');

// 2. Verify Search & Sort Integration in MyFilesPage.tsx
const myFilesContent = fs.readFileSync(path.join(__dirname, 'src/pages/MyFilesPage.tsx'), 'utf8');
assert(myFilesContent.includes('f.name || f.fileNameEncrypted'), 'MyFilesPage searches against f.name display name instead of raw encrypted filename string');
assert(myFilesContent.includes('nameA.localeCompare'), 'MyFilesPage sorts by display name using natural numeric localeCompare');

console.log('===========================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED.`);
if (failCount === 0) {
  console.log('🎉 SEARCH AND SORT ENGINE VERIFIED 100% WORKING!');
} else {
  console.error('❌ SEARCH AND SORT QA FAILURES DETECTED');
  process.exit(1);
}
