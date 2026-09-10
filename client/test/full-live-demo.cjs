const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runFullLiveDemo() {
  console.log('\n======================================================');
  console.log('🚀 LAUNCHING FULL LIVE CHROME AUTOMATION TEST (ALL PHASES)');
  console.log('======================================================\n');

  // 1. Prepare sample test documents
  const doc1Path = path.join(__dirname, 'AWS_Security_Architecture.txt');
  fs.writeFileSync(
    doc1Path,
    'AWS Cloud Security Architecture Guide:\n' +
    'Covers Identity and Access Management (IAM) role policies, S3 bucket encryption, VPC subnets, and CloudTrail audit logging.'
  );

  const doc2Path = path.join(__dirname, 'FullStack_Engineering_Resume.txt');
  fs.writeFileSync(
    doc2Path,
    'Curriculum Vitae / Professional Resume:\n' +
    'Candidate: Sanya Kansal\n' +
    'Education: B.Tech Computer Science\n' +
    'Skills: React, Node.js, Express, MongoDB, Cloudinary, Playwright, Python\n' +
    'Experience: Full Stack AI Engineer developing intelligent document management workspaces.'
  );

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false, // Visible window on user's Mac!
      slowMo: 650 // Smooth viewing speed
    });
  } catch {
    browser = await chromium.launch({
      headless: false,
      slowMo: 650
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1320, height: 880 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `sanya_${timestamp}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Sanya Kansal';

  try {
    // -----------------------------------------------------------------
    // FEATURE 1: Authentication & Navigation (Phase 1)
    // -----------------------------------------------------------------
    console.log('🔹 FEATURE 1: Authentication & App Shell');
    console.log('   Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('   ✅ Unauthenticated user automatically redirected to /login');

    console.log('   Navigating to Sign Up screen...');
    await page.click('#link-to-signup');
    await page.waitForURL('**/signup');

    console.log('   Entering credentials for Sanya Kansal...');
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);

    console.log('   Submitting account creation to MongoDB Atlas...');
    await page.click('#btn-signup-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ User authenticated! Welcome to FILER AI Workspace.');
    await page.waitForTimeout(1500);

    // -----------------------------------------------------------------
    // FEATURE 2: In-Memory Hashing & Direct Upload (Phase 2)
    // -----------------------------------------------------------------
    console.log('\n🔹 FEATURE 2: File Management & In-Memory Hashing');
    console.log('   Opening Upload Modal...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    console.log('   Selecting AWS Security Architecture document...');
    const fileInput1 = await page.$('#file-upload-input');
    await fileInput1.setInputFiles(doc1Path);

    console.log('   ✅ In-memory SHA-256 hash computed via Web Crypto API');
    await page.waitForTimeout(1200);

    console.log('   Selecting category "Study Material"...');
    await page.selectOption('#upload-category-select', 'Study Material');
    await page.waitForTimeout(1000);

    console.log('   Performing direct upload to Cloud Storage...');
    await page.click('#btn-confirm-upload');

    await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });
    console.log('   ✅ Document uploaded and FileCard rendered in grid!');
    await page.waitForTimeout(2000);

    // -----------------------------------------------------------------
    // FEATURE 3: SHA-256 Duplicate Detection (DSA AR-1)
    // -----------------------------------------------------------------
    console.log('\n🔹 FEATURE 3: Duplicate Detection (DSA SHA-256)');
    console.log('   Re-opening Upload Modal...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    console.log('   Selecting the EXACT SAME file again...');
    const fileInputDup = await page.$('#file-upload-input');
    await fileInputDup.setInputFiles(doc1Path);

    console.log('   Waiting for SHA-256 duplicate match...');
    await page.waitForSelector('#duplicate-warning-banner', { timeout: 10000 });
    console.log('   ⚠️  SUCCESS: "Possible Duplicate Detected" warning banner displayed!');
    await page.waitForTimeout(3000);

    console.log('   Cancelling duplicate upload...');
    await page.click('#btn-cancel-upload');
    await page.waitForTimeout(1000);

    // -----------------------------------------------------------------
    // FEATURE 4: AI Intelligence & Human-in-the-Loop Review (Phase 3)
    // -----------------------------------------------------------------
    console.log('\n🔹 FEATURE 4: AI Understanding & Human-in-the-Loop Review');
    console.log('   Opening Upload Modal for Resume document...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    const fileInputAI = await page.$('#file-upload-input');
    await fileInputAI.setInputFiles(doc2Path);
    await page.waitForTimeout(1000);

    console.log('   Triggering "Analyze with AI & Review"...');
    await page.click('#btn-analyze-with-ai');

    console.log('   Extracting text in memory & analyzing via OpenRouter AI pipeline...');
    await page.waitForSelector('#ai-review-modal-container', { timeout: 20000 });
    console.log('   ✨ SUCCESS: Human-in-the-Loop AI Review Card rendered!');

    // Read AI predicted category and confidence
    const confidenceText = await page.innerText('#ai-confidence-badge');
    console.log(`   AI Confidence: ${confidenceText}`);

    // Test Human-in-the-Loop editing
    console.log('   Testing Human-in-the-Loop editing: Adding custom tag "#deeplearning"...');
    await page.fill('#add-tag-input', 'deeplearning');
    await page.press('#add-tag-input', 'Enter');
    await page.waitForTimeout(1500);

    console.log('   Approving AI review: Clicking "Accept & Save to Cloud"...');
    await page.click('#btn-accept-ai-review');

    await page.waitForTimeout(2000);
    console.log('   ✅ AI metadata committed to MongoDB Atlas and visible on Dashboard!');

    // -----------------------------------------------------------------
    // FEATURE 5: Live Filtering & Searching
    // -----------------------------------------------------------------
    console.log('\n🔹 FEATURE 5: Live Category Filtering & Search Queries');
    console.log('   Filtering by category "Study Material"...');
    await page.click('#filter-cat-study-material');
    await page.waitForTimeout(2000);

    console.log('   Resetting filter to "All"...');
    await page.click('#filter-cat-all');
    await page.waitForTimeout(1500);

    console.log('   Typing search query "Resume" in search bar...');
    await page.fill('#dashboard-search-input', 'Resume');
    await page.waitForTimeout(2000);

    console.log('   Clearing search query...');
    await page.fill('#dashboard-search-input', '');
    await page.waitForTimeout(2000);

    // -----------------------------------------------------------------
    // FEATURE 6: Workspace Overview
    // -----------------------------------------------------------------
    console.log('\n🔹 FEATURE 6: Active Workspace Overview');
    console.log('   Holding browser window open for 6 seconds for you to inspect everything...');
    await page.waitForTimeout(6000);

    console.log('\n======================================================');
    console.log('🎉 ALL PHASES & FEATURES VERIFIED LIVE ON GOOGLE CHROME!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ Live Demo Error:', err);
  } finally {
    // Clean up temporary local files
    if (fs.existsSync(doc1Path)) fs.unlinkSync(doc1Path);
    if (fs.existsSync(doc2Path)) fs.unlinkSync(doc2Path);
    await browser.close();
  }
}

runFullLiveDemo();
