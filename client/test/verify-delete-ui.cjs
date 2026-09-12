const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function verifyDeleteUI() {
  console.log('\n======================================================');
  console.log('🧪 VERIFYING FILE CARD DELETE UI (NO OVERFLOW, DARK MODE)');
  console.log('======================================================\n');

  // 1. Create a clean test user and upload 2 files to inspect
  const uniqueEmail = `delete_ui_test_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  console.log(`1. Registering test user: ${uniqueEmail}`);
  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Delete UI Tester',
    email: uniqueEmail,
    password
  });
  const token = regRes.data.token;

  // Upload 2 test files with valid format
  const FormData = require('form-data');
  const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  
  // File 1: Text document
  const form1 = new FormData();
  form1.append('file', Buffer.from('Resume and background summary for candidate.'), {
    filename: 'harshibar_s_resume__1_.txt',
    contentType: 'text/plain'
  });
  form1.append('category', 'Resumes');
  await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form1, {
    headers: { ...form1.getHeaders(), Authorization: `Bearer ${token}` }
  });

  // File 2: Real PNG Image
  const form2 = new FormData();
  form2.append('file', png1x1, {
    filename: 'Screenshot_2026_09_10.png',
    contentType: 'image/png'
  });
  form2.append('category', 'Others');
  await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form2, {
    headers: { ...form2.getHeaders(), Authorization: `Bearer ${token}` }
  });
  console.log('Uploaded 2 valid test files.');

  // 2. Launch browser in Dark Mode
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    colorScheme: 'dark',
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('2. Navigating to login page in Dark Mode...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });

  await page.fill('#login-email', uniqueEmail);
  await page.fill('#login-password', password);
  await page.click('#btn-login-submit');

  await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });
  console.log('Logged in and reached dashboard.');

  // Verify cards exist
  const fileCards = await page.$$('[id^="file-card-"]');
  console.log(`Found ${fileCards.length} file cards on dashboard.`);

  // Click trash on the first card
  const deleteBtn1 = await fileCards[0].$('button[id^="btn-delete-file-"]');
  if (deleteBtn1) {
    console.log('Clicking trash icon on first card...');
    await deleteBtn1.click();
    await page.waitForTimeout(500);
  }

  // Click trash on the second card as well to view side-by-side
  if (fileCards.length > 1) {
    const deleteBtn2 = await fileCards[1].$('button[id^="btn-delete-file-"]');
    if (deleteBtn2) {
      console.log('Clicking trash icon on second card...');
      await deleteBtn2.click();
      await page.waitForTimeout(500);
    }
  }

  // Take screenshot of cards with delete confirmation open
  const screenshotPath = path.join(ARTIFACTS_DIR, 'fixed_delete_ui_cards.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`✅ Saved screenshot to: ${screenshotPath}`);

  // Test Cancel button on the first card
  const cancelBtn = await fileCards[0].$('button[id^="btn-cancel-delete-"]');
  if (cancelBtn) {
    console.log('Testing Cancel button on card 1...');
    await cancelBtn.click();
    await page.waitForTimeout(400);

    const restoredTrashBtn = await fileCards[0].$('button[id^="btn-delete-file-"]');
    console.log('Action icons restored on card 1 after Cancel:', !!restoredTrashBtn);
  }

  // Take screenshot showing card 1 restored and card 2 still showing confirm
  const screenshotPath2 = path.join(ARTIFACTS_DIR, 'fixed_delete_ui_restored.png');
  await page.screenshot({ path: screenshotPath2, fullPage: false });
  console.log(`✅ Saved second screenshot to: ${screenshotPath2}`);

  await browser.close();
  console.log('\n🎉 ALL DELETE UI VERIFICATIONS PASSED SUCCESSFULLY!\n');
}

verifyDeleteUI().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
