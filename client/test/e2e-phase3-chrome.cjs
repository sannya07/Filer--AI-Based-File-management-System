const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runPhase3Chrome() {
  console.log('🚀 Launching Google Chrome for Phase 3 AI Review E2E Testing...');

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
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  const testEmail = `ai_user_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'AI Explorer';

  const sampleFilePath = path.join(__dirname, 'Full_Stack_Architecture_Notes.txt');
  fs.writeFileSync(
    sampleFilePath,
    'Full Stack Architecture and Engineering Notes:\n' +
    'Covers React frontend state management, Express REST API controllers, MongoDB schema indexing, and Cloudinary media delivery networks.'
  );

  try {
    // 1. Sign up
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

    // 3. Select file
    console.log('3. Selecting technical notes file...');
    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(sampleFilePath);

    // Wait for in-memory SHA-256 calculation
    await page.waitForTimeout(1000);

    // 4. Trigger AI Understanding Analysis
    console.log('4. Clicking "Analyze with AI & Review"...');
    await page.click('#btn-analyze-with-ai');

    // 5. Wait for Human-in-the-Loop AI Review Card Modal
    console.log('5. Waiting for Human-in-the-Loop AI Review Card...');
    await page.waitForSelector('#ai-review-modal-container', { timeout: 15000 });
    console.log('   ✅ AI Review Screen Modal rendered!');

    // Verify AI confidence badge and reasoning banner
    await page.waitForSelector('#ai-confidence-badge');
    await page.waitForSelector('#ai-reasoning-banner');
    console.log('   ✅ AI Confidence and Explainable AI Reasoning verified!');

    // 6. Test Human-in-the-Loop Editing: Add a custom tag
    console.log('6. Adding a custom tag "#cloudarchitecture"...');
    await page.fill('#add-tag-input', 'cloudarchitecture');
    await page.press('#add-tag-input', 'Enter');
    await page.waitForTimeout(500);

    // Capture screenshot of the Human-in-the-Loop Review Screen
    const reviewScreenScreenshot = path.join(ARTIFACTS_DIR, 'phase3_ai_review_screen.png');
    await page.screenshot({ path: reviewScreenScreenshot });
    console.log('   📸 Saved AI Review Screen screenshot:', reviewScreenScreenshot);

    // 7. Accept and Save to Cloud
    console.log('7. Clicking "Accept & Save to Cloud"...');
    await page.click('#btn-accept-ai-review');

    // 8. Verify FileCard with AI metadata appears on Dashboard
    console.log('8. Verifying FileCard with AI metadata on Dashboard...');
    await page.waitForSelector('[id^="file-card-"]', { timeout: 15000 });
    console.log('   ✅ File card with AI metadata rendered on Dashboard!');

    await page.waitForTimeout(1500);

    // Capture screenshot of Dashboard with AI file card
    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'phase3_dashboard_ai_file.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log('   📸 Saved Dashboard screenshot:', dashboardScreenshot);

    console.log('\n🎉 ALL PHASE 3 AI CHROME E2E TESTS PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 3 E2E Test Failed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
    await browser.close();
  }
}

runPhase3Chrome();
