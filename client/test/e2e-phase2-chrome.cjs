const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runPhase2Chrome() {
  console.log('🚀 Launching Google Chrome for Phase 2 E2E Testing...');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true // Fast and reliable
    });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const testEmail = `phase2_user_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Phase 2 Tester';

  // Create temporary sample test file for upload
  const sampleFilePath = path.join(__dirname, 'sample_notes.txt');
  fs.writeFileSync(
    sampleFilePath,
    'AWS Cloud Architecture Notes:\n- IAM Policies\n- S3 Buckets and Object Storage\n- EC2 Compute Instances\n- VPC Networking'
  );

  try {
    // 1. Sign up new account
    console.log('1. Signing up user on Chrome...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ User authenticated on Dashboard');

    // 2. Open Upload Modal
    console.log('2. Opening Upload Modal...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');
    console.log('   ✅ Upload Modal open');

    // 3. Set file in input
    console.log('3. Selecting sample file for upload...');
    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(sampleFilePath);

    // Wait for in-memory hashing and UI update
    await page.waitForTimeout(1000);

    // Change category to "Study Material"
    await page.selectOption('#upload-category-select', 'Study Material');

    // 4. Submit Upload
    console.log('4. Clicking Upload to Cloud...');
    await page.click('#btn-confirm-upload');

    // 5. Verify file card appears on Dashboard
    console.log('5. Verifying FileCard on Dashboard...');
    await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });
    console.log('   ✅ FileCard rendered successfully on Dashboard!');

    // Wait for stats update
    await page.waitForTimeout(1000);

    // Capture screenshot with uploaded file
    const dashboardWithFiles = path.join(ARTIFACTS_DIR, 'phase2_dashboard_with_files.png');
    await page.screenshot({ path: dashboardWithFiles });
    console.log('   📸 Saved Dashboard with file card:', dashboardWithFiles);

    // 6. Test Duplicate Detection (DSA AR-1)
    console.log('6. Testing Duplicate Detection: Selecting the exact same file...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    const fileInput2 = await page.$('#file-upload-input');
    await fileInput2.setInputFiles(sampleFilePath);

    // Wait for SHA-256 hash check
    await page.waitForSelector('#duplicate-warning-banner', { timeout: 10000 });
    console.log('   ✅ "Possible Duplicate Detected" banner correctly appeared!');

    // Capture screenshot of duplicate warning modal
    const dupWarningScreenshot = path.join(ARTIFACTS_DIR, 'phase2_duplicate_warning.png');
    await page.screenshot({ path: dupWarningScreenshot });
    console.log('   📸 Saved Duplicate Warning screenshot:', dupWarningScreenshot);

    // Click Cancel on duplicate
    await page.click('#btn-cancel-upload');
    console.log('   ✅ Duplicate upload cancelled cleanly.');

    // 7. Test File Deletion
    console.log('7. Testing File Deletion...');
    await page.click('button[title="Delete file"]');
    // Confirm delete
    await page.click('text=Confirm');
    await page.waitForSelector('#empty-files-container', { timeout: 10000 });
    console.log('   ✅ File deleted, empty state returned!');

    console.log('\n🎉 ALL PHASE 2 CHROME E2E TESTS PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 2 E2E Test Failed:', err);
    process.exit(1);
  } finally {
    // Clean up temporary sample file
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
    await browser.close();
  }
}

runPhase2Chrome();
