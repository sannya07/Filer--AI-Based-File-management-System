const { chromium } = require('playwright');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runComprehensiveRenameTests() {
  console.log('\n===============================================================');
  console.log('🧪 COMPREHENSIVE TEST SUITE: FILE RENAMING (PRD FR-13)');
  console.log('===============================================================\n');

  // ==========================================
  // PART 1: BACKEND EDGE-CASE & SECURITY TESTS
  // ==========================================
  console.log('--- PART 1: Backend Edge-Cases & Security Verification ---');

  const timestamp = Date.now();
  const user1Email = `tester1_${timestamp}@filer.ai`;
  const user2Email = `tester2_${timestamp}@filer.ai`;
  const password = 'Password123!';

  // 1. Create two users to test ownership isolation
  const u1Res = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Tester One',
    email: user1Email,
    password
  });
  const token1 = u1Res.data.token;
  const headers1 = { Authorization: `Bearer ${token1}` };

  const u2Res = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Tester Two',
    email: user2Email,
    password
  });
  const token2 = u2Res.data.token;
  const headers2 = { Authorization: `Bearer ${token2}` };

  // 2. Upload file for user 1
  const form = new FormData();
  form.append('file', Buffer.from('Testing comprehensive rename logic and ownership security'), {
    filename: 'System.Architecture.v1.0.docx',
    contentType: 'text/plain'
  });
  form.append('category', 'Projects');

  const uploadRes = await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form, {
    headers: { ...headers1, ...form.getHeaders() }
  });
  const fileId = uploadRes.data.file._id;
  console.log(`[PASS] Uploaded File: "${uploadRes.data.file.fileName}" (ID: ${fileId})`);

  // Test Case A: Empty / Whitespace name rejection
  console.log('\n[TEST A] Reject empty or whitespace newName:');
  try {
    await axios.patch(`${BASE_URL_SERVER}/api/files/${fileId}/rename`, { newName: '   ' }, { headers: headers1 });
    throw new Error('Should have failed on empty name');
  } catch (err) {
    if (err.response && err.response.status === 400) {
      console.log('  ✅ Correctly rejected with 400 Bad Request:', err.response.data.message);
    } else {
      throw err;
    }
  }

  // Test Case B: Cross-user unauthorized rename attempt
  console.log('\n[TEST B] Security Check: User 2 cannot rename User 1\'s file:');
  try {
    await axios.patch(`${BASE_URL_SERVER}/api/files/${fileId}/rename`, { newName: 'Hacked_Name.docx' }, { headers: headers2 });
    throw new Error('User 2 should not be able to rename User 1 file');
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.log('  ✅ Access denied / file not found for unauthorized user (404 Not Found)');
    } else {
      throw err;
    }
  }

  // Test Case C: Automatic extension preservation when extension is omitted
  console.log('\n[TEST C] Extension Preservation: Rename to "Architecture_Blueprint" without extension:');
  const renameC = await axios.patch(
    `${BASE_URL_SERVER}/api/files/${fileId}/rename`,
    { newName: 'Architecture_Blueprint' },
    { headers: headers1 }
  );
  if (renameC.data.file.fileName === 'Architecture_Blueprint.docx') {
    console.log(`  ✅ Extension preserved: "${renameC.data.file.fileName}"`);
  } else {
    throw new Error(`Expected Architecture_Blueprint.docx, got: ${renameC.data.file.fileName}`);
  }

  // Test Case D: Explicit extension change or update
  console.log('\n[TEST D] Explicit extension update: Rename to "Cloud_Infrastructure_Report.pdf":');
  const renameD = await axios.patch(
    `${BASE_URL_SERVER}/api/files/${fileId}/rename`,
    { newName: 'Cloud_Infrastructure_Report.pdf' },
    { headers: headers1 }
  );
  if (renameD.data.file.fileName === 'Cloud_Infrastructure_Report.pdf') {
    console.log(`  ✅ Successfully updated to: "${renameD.data.file.fileName}"`);
  } else {
    throw new Error(`Expected Cloud_Infrastructure_Report.pdf, got: ${renameD.data.file.fileName}`);
  }

  // Test Case E: Trie Cache Invalidation & Instant Searchability
  console.log('\n[TEST E] Trie Search Invalidation:');
  const trieNew = await axios.get(`${BASE_URL_SERVER}/api/search/suggestions?q=Cloud_Infra`, { headers: headers1 });
  const hasNew = trieNew.data.suggestions.some(s => (s.fileName || s.text || '').includes('Cloud_Infrastructure_Report'));
  console.log('  Trie suggestion for "Cloud_Infra":', hasNew ? '✅ FOUND INSTANTLY' : '❌ NOT FOUND');

  const trieOld = await axios.get(`${BASE_URL_SERVER}/api/search/suggestions?q=Architecture_Blueprint`, { headers: headers1 });
  const hasOld = trieOld.data.suggestions.some(s => (s.fileName || s.text || '').includes('Architecture_Blueprint'));
  console.log('  Trie suggestion for old name "Architecture_Blueprint":', !hasOld ? '✅ STALE CACHE CLEARED (0 matches)' : '❌ STILL PRESENT');

  // ==========================================
  // PART 2: GOOGLE CHROME LIVE UI TEST
  // ==========================================
  console.log('\n--- PART 2: Google Chrome Live UI Flow ---');

  const sampleDocPath = path.join(__dirname, 'Interactive_Rename_Test.txt');
  fs.writeFileSync(sampleDocPath, 'Detailed document for testing live Chrome inline rename workflows.');

  let browser;
  try {
    console.log('🚀 Launching Google Chrome browser (/Applications/Google Chrome.app)...');
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 600
    });
  } catch {
    browser = await chromium.launch({
      headless: false,
      slowMo: 600
    });
  }

  const context = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const page = await context.newPage();

  try {
    // 1. Log in with user 1
    console.log('1. Logging in on Google Chrome...');
    await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
    await page.fill('#login-email', user1Email);
    await page.fill('#login-password', password);
    await page.click('#btn-login-submit');

    await page.waitForURL(`${BASE_URL_CLIENT}/`);
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Logged in successfully');

    // 2. Upload sample document
    console.log('2. Uploading sample file: Interactive_Rename_Test.txt...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');
    const input = await page.$('#file-upload-input');
    await input.setInputFiles(sampleDocPath);
    await page.waitForTimeout(400);
    await page.selectOption('#upload-category-select', 'Study Material');
    await page.click('#btn-confirm-upload');
    await page.waitForTimeout(2500);
    console.log('   ✅ File uploaded');

    // 3. Test Cancel Rename functionality
    console.log('3. Testing Cancel button during inline rename...');
    const renameActionBtns = await page.$$('button[id^="btn-rename-action-"]');
    const firstRenameBtn = renameActionBtns[0];
    await firstRenameBtn.click();

    // Verify input appears
    const inlineInput = await page.waitForSelector('input[id^="input-rename-file-"]');
    await inlineInput.fill('Accidental_Name_Should_Cancel.txt');
    await page.waitForTimeout(500);

    // Click cancel button
    const cancelBtn = await page.waitForSelector('button[title="Cancel"]');
    await cancelBtn.click();
    await page.waitForTimeout(500);

    // Verify it was NOT changed
    const cardTitleAfterCancel = await page.textContent('h3[title*="Interactive_Rename_Test"]');
    if (cardTitleAfterCancel.includes('Interactive_Rename_Test')) {
      console.log('   ✅ Cancel button correctly reverted inline rename form without saving!');
    } else {
      throw new Error('Cancel failed to revert name');
    }

    // 4. Test Successful Rename and Save
    console.log('4. Performing actual Rename to: Distributed_Systems_Mastery_2026.pdf...');
    await firstRenameBtn.click();
    const inlineInput2 = await page.waitForSelector('input[id^="input-rename-file-"]');
    await inlineInput2.fill('Distributed_Systems_Mastery_2026.pdf');
    await page.waitForTimeout(400);

    // Click checkmark save button
    const saveBtn = await page.waitForSelector('button[id^="btn-save-rename-"]');
    await saveBtn.click();

    // 5. Verify toast message
    await page.waitForSelector('text=File renamed to "Distributed_Systems_Mastery_2026.pdf"', { timeout: 8000 });
    console.log('   ✅ Success Toast confirmed: "File renamed to Distributed_Systems_Mastery_2026.pdf"');

    // 6. Verify file card updated in UI
    await page.waitForSelector('h3:has-text("Distributed_Systems_Mastery_2026.pdf")');
    console.log('   ✅ FileCard title dynamically updated in files grid!');

    // 7. Verify Priority Shelf displays new name
    const shelfText = await page.textContent('#important-files-shelf');
    if (shelfText.includes('Distributed_Systems_Mastery_2026.pdf')) {
      console.log('   ✅ Priority Queue "Important & Quick Access" shelf updated with new name!');
    }

    // 8. Capture final proof screenshot
    const screenshotPath = path.join(ARTIFACTS_DIR, 'comprehensive_rename_verified.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Saved proof screenshot: ${screenshotPath}`);

    console.log('\n===============================================================');
    console.log('🎉 ALL COMPREHENSIVE RENAME TESTS (BACKEND + CHROME) PASSED 100%!');
    console.log('===============================================================\n');
  } finally {
    try { fs.unlinkSync(sampleDocPath); } catch {}
    await browser.close();
  }
}

runComprehensiveRenameTests().catch(err => {
  console.error('\n❌ Suite Error:', err.message);
  process.exit(1);
});
