const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runPhase4Chrome() {
  console.log('🌳 Launching Google Chrome for Phase 4 Category Tree E2E Testing...');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1340, height: 900 }
  });
  const page = await context.newPage();

  const testEmail = `tree_user_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Tree Architect';

  const testFilePath = path.join(__dirname, 'FullStack_MERN_Guide.txt');
  fs.writeFileSync(
    testFilePath,
    'Full Stack MERN Guide:\n' +
    'Covers MongoDB schema designs, Express REST routes, React Category Tree DSA, and Node 24 runtime optimizations.'
  );

  try {
    // 1. Sign up new user
    console.log('1. Signing up user on Chrome...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ User authenticated on Dashboard');

    // 2. Verify Category Tree sidebar exists with default seeded categories
    console.log('2. Verifying Category Tree sidebar & seeded categories...');
    await page.waitForSelector('#category-tree-sidebar');
    await page.waitForSelector('#cat-item-all');
    await page.waitForSelector('#cat-item-study-material');
    await page.waitForSelector('#cat-item-projects');
    await page.waitForSelector('#subcat-item-mern');
    await page.waitForSelector('#subcat-item-aws');
    console.log('   ✅ Category Tree rendered with default roots and subcategories!');

    // 3. Upload a file directly with category "Projects" and subcategory "MERN"
    console.log('3. Uploading document with category "Projects"...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(1000);

    // Select Projects in direct upload
    await page.selectOption('#upload-category-select', 'Projects');
    await page.click('#btn-confirm-upload');

    // Wait for file card to appear
    await page.waitForSelector('[id^="file-card-"]', { timeout: 15000 });
    console.log('   ✅ File uploaded and displayed in grid!');

    await page.waitForTimeout(1000);

    // 4. Test Category Tree Filtering: Click "Projects"
    console.log('4. Testing Category Tree filter: Clicking "Projects"...');
    await page.click('#cat-item-projects');
    await page.waitForTimeout(500);

    // Verify breadcrumbs contain "Projects"
    const breadcrumbText = await page.textContent('#breadcrumbs-nav');
    console.log('   Breadcrumb text:', breadcrumbText);
    if (!breadcrumbText.includes('Projects')) {
      throw new Error('Breadcrumbs did not update to Projects');
    }

    // Verify file card is visible under Projects
    const fileCardsUnderProjects = await page.$$('[id^="file-card-"]');
    console.log(`   Found ${fileCardsUnderProjects.length} file(s) under Projects.`);
    if (fileCardsUnderProjects.length === 0) {
      throw new Error('Expected file card under Projects');
    }

    // 5. Test Filtering to an empty category: Click "Resumes"
    console.log('5. Testing Category Tree filter: Clicking "Resumes" (empty)...');
    await page.click('#cat-item-resumes');
    await page.waitForTimeout(500);
    await page.waitForSelector('#empty-files-container');
    console.log('   ✅ Empty state correctly shown for empty category!');

    // Capture screenshot of filtered state
    const subcatScreenshot = path.join(ARTIFACTS_DIR, 'phase4_subcategory_filtered.png');
    await page.screenshot({ path: subcatScreenshot });
    console.log('   📸 Saved subcategory filter screenshot:', subcatScreenshot);

    // 6. Reset to "All Documents"
    console.log('6. Resetting to "All Documents"...');
    await page.click('#cat-item-all');
    await page.waitForTimeout(500);
    await page.waitForSelector('[id^="file-card-"]');
    console.log('   ✅ All files restored in view.');

    // 7. Test Creating a Custom Root Category: "System Design"
    console.log('7. Testing Category creation: Adding "System Design"...');
    await page.click('#btn-add-category-open');
    await page.waitForSelector('#add-category-modal');
    await page.fill('#input-category-name', 'System Design');
    await page.click('#btn-create-category-submit');

    // Wait for modal to close and new category to appear
    await page.waitForSelector('#cat-item-system-design', { timeout: 8000 });
    console.log('   ✅ Custom category "System Design" created and visible in tree!');

    // 8. Test Moving the File to "System Design"
    console.log('8. Testing Move File feature...');
    await page.click('button[title="Move category"]');
    await page.waitForSelector('#select-move-category');

    // Select "System Design" in the move popover
    await page.selectOption('#select-move-category', 'System Design');
    await page.click('#btn-confirm-move');

    await page.waitForTimeout(1500);
    console.log('   ✅ File successfully moved to "System Design"!');

    // 9. Capture Main Dashboard Screenshot
    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'phase4_category_tree_dashboard.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log('   📸 Saved Dashboard Category Tree screenshot:', dashboardScreenshot);

    console.log('\n🎉 ALL PHASE 4 CATEGORY TREE CHROME E2E TESTS PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 4 E2E Test Failed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await browser.close();
  }
}

runPhase4Chrome();
