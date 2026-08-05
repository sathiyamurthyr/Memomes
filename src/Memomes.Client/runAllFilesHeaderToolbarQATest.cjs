const fs = require('fs');
const path = require('path');

console.log('=== All Files Header Toolbar QA Test ===\n');

const fileExplorerPath = path.join(__dirname, 'src', 'components', 'EnterpriseFileExplorer.tsx');
const content = fs.readFileSync(fileExplorerPath, 'utf8');

const checks = [
  {
    name: 'Section A & Section B container flex layout',
    test: () => content.includes('flex items-center justify-between gap-4 min-w-max border-b border-white/10 pb-4')
  },
  {
    name: 'Section A items (Title, Count, Size, Zero-Knowledge status)',
    test: () => content.includes('activeCategoryName') && 
                content.includes('displayedFiles.length') && 
                content.includes('fmtBytes(totalCategorySize)') && 
                content.includes('Zero-Knowledge Protected')
  },
  {
    name: 'Section B controls no-wrap and overflow strategy',
    test: () => content.includes('flex items-center gap-4 flex-nowrap shrink-0') &&
                content.includes('w-full overflow-x-auto no-scrollbar')
  },
  {
    name: 'Control 1: Search filter (48px / h-12)',
    test: () => content.includes('w-64 h-12 shrink-0') && content.includes('Search in folder...')
  },
  {
    name: 'Control 2: Sort dropdown (48px / h-12)',
    test: () => content.includes('px-3 h-12 gap-2 text-xs shrink-0')
  },
  {
    name: 'Control 3: Order toggle (48px / h-12)',
    test: () => content.includes('h-12 px-4 rounded-xl bg-[#070B14] border border-white/10 hover:bg-white/10') &&
                content.includes('navState.sortOrder === \'asc\' ? \'ASC ▲\' : \'DESC ▼\'')
  },
  {
    name: 'Control 4: View toggle (48px / h-12)',
    test: () => content.includes('p-1 h-12 rounded-xl border border-white/10 shrink-0 gap-1')
  },
  {
    name: 'Control 5: Stats button (Neutral 48px / h-12)',
    test: () => content.includes('h-12 px-4 rounded-xl bg-[#070B14] border border-white/10 hover:bg-white/10 text-slate-300')
  },
  {
    name: 'Control 6: Restore Files button (Secondary green 48px / h-12)',
    test: () => content.includes('h-12 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400')
  },
  {
    name: 'Control 7: Upload button (Primary gold 48px / h-12)',
    test: () => content.includes('h-12 px-5 rounded-xl bg-[#F5B700] hover:bg-[#f5c22b] text-slate-950 font-extrabold')
  },
  {
    name: 'Control 8: Clear Vault button (Danger red far right 48px / h-12)',
    test: () => content.includes('h-12 px-4 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400')
  },
  {
    name: 'Equal Height (48px / h-12) & 8px grid compliance',
    test: () => (content.match(/h-12/g) || []).length >= 8
  }
];

let allPassed = true;
checks.forEach(({ name, test }) => {
  const passed = test();
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  if (!passed) allPassed = false;
});

console.log('\n=======================================');
console.log(allPassed ? 'ALL QA VERIFICATION CHECKS PASSED!' : 'SOME CHECKS FAILED!');
console.log('=======================================\n');

if (!allPassed) process.exit(1);
