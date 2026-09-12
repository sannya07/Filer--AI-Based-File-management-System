const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testRenameChrome() {
  console.log('\n======================================================');
  console.log('🚀 TESTING FILE RENAMING (PRD FR-13) ON GOOGLE CHROME');
  console.log('======================================================\n');

  const testFilePath = path.join(__dirname, 'Client_Project_Draft.txt');
  fs.writeFileSync(testFilePath, 'Technical specifications and deliverables for client project review.');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 500
    });
  } catch {
    browser = await chromium.launch({
      headless: false,
      slowMo: 500
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `rename_user_${timestamp}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Sanya Kansal';

  try {
    // 1. Sign Up & Auth
    console.log('🔹 1. Registering test user on FILER AI...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Authenticated on Dashboard');

    // 2. Upload File
    console.log('🔹 2. Uploading test file: Client_Project_Draft.txt...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(testFilePath);
    await page.waitForTimeout(500);

    await page.selectOption('#upload-category-select', 'Projects');
    await page.click('#btn-confirm-upload');
    await page.waitForTimeout(2500);
    console.log('   ✅ File uploaded and displayed in file grid');

    // 3. Find file card and verify initial name
    await page.waitForSelector('h3:has-text("Client_Project_Draft.txt")');
    console.log('   ✅ Initial file name verified on FileCard: Client_Project_Draft.txt');

    // 4. Click Rename Action Button (PRD FR-13)
    console.log('🔹 3. Triggering Rename mode...');
    const renameActionBtn = await page.waitForSelector('button[id^="btn-rename-action-"]');
    await renameActionBtn.click();

    // 5. Verify inline rename input appears
    const renameInput = await page.waitForSelector('input[id^="input-rename-file-"]');
    console.log('   ✅ Inline rename input active');

    // Clear and type new name
    await renameInput.fill('Client_Project_Final_v2.txt');
    console.log('   ✏️ Typed new name: Client_Project_Final_v2.txt');

    // 6. Click Save Button
    const saveRenameBtn = await page.waitForSelector('button[id^="btn-save-rename-"]');
    await saveRenameBtn.click();
    console.log('   💾 Submitted rename form');

    // 7. Verify toast and updated file card
    await page.waitForSelector('text=File renamed to "Client_Project_Final_v2.txt"', { timeout: 8000 });
    console.log('   ✅ Toast notification verified: "File renamed to Client_Project_Final_v2.txt"');

    await page.waitForSelector('h3:has-text("Client_Project_Final_v2.txt")');
    console.log('   ✅ FileCard title updated immediately: Client_Project_Final_v2.txt');

    // 8. Verify Trie Autocomplete with new file name
    console.log('🔹 4. Verifying Trie prefix autocomplete with new file name...');
    await page.fill('#dashboard-search-input', 'Client_Project_Final');
    await page.waitForTimeout(1000);

    await page.waitForSelector('#trie-autocomplete-dropdown', { timeout: 8000 });
    const dropdownText = await page.textContent('#trie-autocomplete-dropdown');
    console.log('   ✅ Trie autocomplete returned suggestions:\n', dropdownText.trim());

    // 9. Capture screenshot
    const screenshotPath = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4/rename_file_verified.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Captured screenshot: ${screenshotPath}`);

    console.log('\n🎉 ALL FILE RENAMING (PRD FR-13) CHROME TESTS PASSED 100%! ✅\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(testFilePath); } catch {}
    await browser.close();
  }
}

testRenameChrome();
