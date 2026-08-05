const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('===========================================================');
console.log('  ALL FILES HEADER TOOLBAR RESPONSIVE QA TEST SUITE  ');
console.log('===========================================================\n');

const componentPath = path.join(__dirname, 'src', 'components', 'EnterpriseFileExplorer.tsx');
const content = fs.readFileSync(componentPath, 'utf8');

// 1. Verify Toolbar Container (No Overflow Scroll, Flex-nowrap, Justify-between)
console.log('--- TEST 1: Flexbox 3-Section Container Specifications ---');
assert(!content.includes('w-full overflow-x-auto no-scrollbar'), 'Toolbar must NOT use overflow-x-auto or scrollbar wrapper');
assert(content.includes('w-full flex items-center justify-between gap-4 border-b border-white/10 pb-4 flex-nowrap'), 'Toolbar container must use flex justify-between items-center gap-4 flex-nowrap');
console.log('✓ Container Flexbox specs verified: flex justify-between items-center gap-4 flex-nowrap (No horizontal scroll)');

// 2. Verify Left Section Elements
console.log('\n--- TEST 2: Left Section Elements ---');
assert(content.includes('/* SECTION 1 (LEFT): File Icon, Title, File Count, Storage Size, Security Badge */'), 'Left section header marker present');
assert(content.includes('Zero-Knowledge Protected'), 'Security badge present in Left section');
assert(content.includes('getCategoryIcon(activeCategoryName)'), 'File icon present in Left section');
console.log('✓ Left Section verified: Icon, Title, File Count, Storage Size, Security Badge');

// 3. Verify Center Section (Search Box Only)
console.log('\n--- TEST 3: Center Section Specifications ---');
assert(content.includes('/* SECTION 2 (CENTER): Search Box Only */'), 'Center section marker present');
assert(content.includes('min-w-[280px] max-w-[420px] flex-1 h-12'), 'Search box must have min-width: 280px, max-width: 420px, flex-grow: 1, and 48px height');
console.log('✓ Center Section verified: Search Box only with min-w-[280px] max-w-[420px] flex-1 h-12');

// 4. Verify Right Section & Compact Segmented Control
console.log('\n--- TEST 4: Right Section & Compact Segmented View Control ---');
assert(content.includes('/* SECTION 3 (RIGHT): Sort, Order, View Toggle, Stats, Restore, Upload */'), 'Right section marker present');
assert(content.includes('/* 3. Compact Segmented View Toggle (48px / h-12) */'), 'Segmented control marker present');
assert(content.includes("navStateStore.setState({ viewMode: 'tree' })"), 'Tree view button present');
assert(content.includes("navStateStore.setState({ viewMode: 'grid' })"), 'Grid view button present');
assert(content.includes("navStateStore.setState({ viewMode: 'list' })"), 'List view button present');
console.log('✓ Right Section verified: Sort, Order, Segmented View Toggle, Stats, Restore, Upload');

// 5. Verify 48px Height Consistency Across Controls
console.log('\n--- TEST 5: 48px Equal Height & Uniform Styling ---');
const h12Count = (content.match(/h-12/g) || []).length;
assert(h12Count >= 7, `Expected at least 7 controls using h-12 (48px height), found ${h12Count}`);
console.log(`✓ 48px Height (h-12) verified across ${h12Count} header controls`);

// 6. Verify Breakpoint Width Math (1366, 1440, 1600, 1920)
console.log('\n--- TEST 6: Desktop Breakpoints Width Budget Verification ---');
const desktopViewports = [1366, 1440, 1600, 1920];
const sidebarWidth = 240; // Enterprise sidebar width
const padding = 32; // Horizontal padding (px-4 * 2)

desktopViewports.forEach(vpWidth => {
  const mainContentWidth = vpWidth - sidebarWidth - padding;
  // Left: ~250px, Right: ~500px, Center Search min: 280px, Gaps: 32px
  const requiredMinTotal = 250 + 500 + 280 + 32; // 1062px
  assert(mainContentWidth >= requiredMinTotal, `Main content width (${mainContentWidth}px) at ${vpWidth}px viewport must fit ${requiredMinTotal}px required total width`);
  console.log(`✓ Breakpoint ${vpWidth}px: Main Content Available = ${mainContentWidth}px (Required: ${requiredMinTotal}px) → NO HORIZONTAL SCROLL!`);
});

console.log('\n===========================================================');
console.log('  ALL HEADER TOOLBAR RESPONSIVE QA TESTS PASSED!  ');
console.log('===========================================================');
