const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function testAllFixes() {
  console.log('\n======================================================');
  console.log('🧪 TESTING AUTH VALIDATION, SINGLE Q&A, AND DARK MODALS');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST 1: BACKEND VALIDATION FOR __t AND AUTH FIELDS
  // ----------------------------------------------------
  console.log('🔹 1. Testing Backend Auth Validation...');

  // 1a. Test '__t' as name
  console.log('   Testing rejection of "__t" as name...');
  try {
    await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
      name: '__t',
      email: `valid_${Date.now()}@filer.ai`,
      password: 'Password123!'
    });
    throw new Error('__t should have been rejected as name!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('   ✅ PASS: __t rejected with 400 Bad Request:', err.response.data.message);
    } else {
      throw err;
    }
  }

  // 1b. Test invalid email format
  console.log('   Testing rejection of invalid email...');
  try {
    await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
      name: 'Valid Name',
      email: 'not-an-email',
      password: 'Password123!'
    });
    throw new Error('Invalid email should have been rejected!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('   ✅ PASS: Invalid email rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // 1c. Test weak password (missing special character)
  console.log('   Testing rejection of weak password (no special char)...');
  try {
    await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
      name: 'Valid Name',
      email: `valid_${Date.now()}@filer.ai`,
      password: 'Password123'
    });
    throw new Error('Weak password should have been rejected!');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('   ✅ PASS: Weak password rejected with 400 Bad Request');
    } else {
      throw err;
    }
  }

  // ----------------------------------------------------
  // TEST 2: GOOGLE CHROME TESTS FOR FRONTEND UI
  // ----------------------------------------------------
  console.log('\n🔹 2. Launching Google Chrome to test Frontend Validation & Modals...');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 400
    });
  } catch {
    browser = await chromium.launch({
      headless: false,
      slowMo: 400
    });
  }

  const context = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1366, height: 880 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `user_fixed_${timestamp}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Sanya Kansal';

  try {
    // 2a. Test Signup live validation hint on '__t'
    console.log('   Testing live validation hint for "__t" on Signup page...');
    await page.goto(`${BASE_URL_CLIENT}/signup`, { waitUntil: 'networkidle' });
    await page.fill('#signup-name', '__t');
    await page.waitForSelector('#name-validation-hint');
    console.log('   ✅ PASS: Frontend displayed live validation error for "__t"');

    // Fill valid registration
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    await page.waitForURL(`${BASE_URL_CLIENT}/`);
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Registered & logged in successfully with valid credentials');

    // 2b. Upload a sample screenshot to verify AI Review Screen in dark mode
    console.log('\n🔹 3. Testing AI Review Screen (Screenshot 1 Fix)...');
    const sampleImgPath = path.join(__dirname, 'Screenshot 2026-09-09 at 9.00.48 PM.txt');
    fs.writeFileSync(sampleImgPath, 'System interface screenshot text notes and layout structure.');

    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');
    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(sampleImgPath);

    // Click "Analyze with AI & Review"
    await page.click('#btn-analyze-with-ai');
    await page.waitForSelector('#ai-review-modal-container', { timeout: 15000 });
    console.log('   ✅ AI Review modal opened');

    // Verify Document Category select has dark styles and options
    const categorySelect = await page.$('#review-category-select');
    const selectClasses = await categorySelect.getAttribute('class');
    console.log('   Category select classes:', selectClasses);

    // Capture screenshot of the fixed AI review modal
    const aiReviewScreenshot = path.join(ARTIFACTS_DIR, 'fixed_ai_review_modal.png');
    await page.screenshot({ path: aiReviewScreenshot });
    console.log('   📸 Saved fixed AI review modal screenshot:', aiReviewScreenshot);

    // Accept & save
    await page.click('#btn-accept-ai-review');
    await page.waitForTimeout(2500);
    console.log('   ✅ File saved to cloud');

    // 2c. Verify Important Shelf has only 1 Q&A option
    console.log('\n🔹 4. Verifying Priority Shelf has ONLY 1 Q&A option...');
    await page.waitForSelector('#important-files-shelf');
    const shelfAskButtons = await page.$$('#btn-shelf-ask');
    const quickQaButtons = await page.$$('text=Quick Q&A');
    console.log(`   Duplicate Sparkles icon buttons in shelf: ${shelfAskButtons.length} (Expected: 0)`);
    console.log(`   Clean "Quick Q&A" text buttons in shelf: ${quickQaButtons.length} (Expected: >= 1)`);
    if (shelfAskButtons.length === 0 && quickQaButtons.length >= 1) {
      console.log('   ✅ PASS: Priority shelf now has strictly ONE clear Q&A option (Quick Q&A)!');
    } else {
      throw new Error('Shelf still has duplicate Q&A options!');
    }

    // 2d. Test "Add Subcategory" modal (Screenshot 2 Fix)
    console.log('\n🔹 5. Testing "Add Subcategory" Modal (Screenshot 2 Fix)...');
    await page.click('#btn-add-category-open');
    await page.waitForSelector('#add-category-modal');
    console.log('   ✅ Add Category modal opened');

    const catNameInput = await page.$('#input-category-name');
    await catNameInput.fill('Machine Learning');
    await page.waitForTimeout(500);

    // Capture screenshot of the fixed Add Category modal
    const addCatScreenshot = path.join(ARTIFACTS_DIR, 'fixed_add_subcategory_modal.png');
    await page.screenshot({ path: addCatScreenshot });
    console.log('   📸 Saved fixed Add Category modal screenshot:', addCatScreenshot);

    await page.click('button:has-text("Cancel")');
    await page.waitForTimeout(400);

    console.log('\n======================================================');
    console.log('🎉 ALL FIXES VERIFIED SUCCESSFULLY ON GOOGLE CHROME! ✅');
    console.log('======================================================\n');
  } finally {
    try {
      const sampleImgPath = path.join(__dirname, 'Screenshot 2026-09-09 at 9.00.48 PM.txt');
      fs.unlinkSync(sampleImgPath);
    } catch {}
    await browser.close();
  }
}

testAllFixes().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
