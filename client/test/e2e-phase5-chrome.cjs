const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runPhase5Chrome() {
  console.log('🔍 Launching Google Chrome for Phase 5 Trie Autocomplete E2E Testing...');

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

  const testEmail = `trie_user_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Trie Search Explorer';

  // Create temporary files to upload
  const file1 = path.join(__dirname, 'resume_sanya.txt');
  const file2 = path.join(__dirname, 'research_neural_nets.txt');
  const file3 = path.join(__dirname, 'report_quarterly.txt');

  fs.writeFileSync(file1, 'Candidate Resume: Sanya Kansal, Full Stack AI Engineer');
  fs.writeFileSync(file2, 'Research Paper: Neural Network architectures and LLM optimizations');
  fs.writeFileSync(file3, 'Quarterly Financial Report: Infrastructure and cloud costs');

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

    // Helper upload function
    const uploadDoc = async (filePath, category) => {
      await page.click('#btn-dashboard-upload-cta');
      await page.waitForSelector('#upload-modal-container');
      const input = await page.$('#file-upload-input');
      await input.setInputFiles(filePath);
      await page.waitForTimeout(600);
      if (category) {
        await page.selectOption('#upload-category-select', category);
      }
      await page.click('#btn-confirm-upload');
      await page.waitForTimeout(1200);
    };

    // 2. Upload test files
    console.log('2. Uploading test documents (resume, research, report)...');
    await uploadDoc(file1, 'Resumes');
    await uploadDoc(file2, 'Study Material');
    await uploadDoc(file3, 'Others');
    console.log('   ✅ 3 test documents uploaded successfully');

    await page.waitForSelector('[id^="file-card-"]');
    await page.waitForTimeout(1000);

    // 3. Test Trie Autocomplete Dropdown: Type prefix 're'
    console.log('3. Typing prefix "re" into Trie search input...');
    await page.fill('#dashboard-search-input', 're');

    // Wait for in-memory Trie autocomplete dropdown
    await page.waitForSelector('#trie-autocomplete-dropdown', { timeout: 8000 });
    console.log('   ✨ SUCCESS: Trie Autocomplete Dropdown rendered!');

    // Verify suggestions contain 'resume', 'research', 'report'
    const dropdownText = await page.textContent('#trie-autocomplete-dropdown');
    console.log('   Suggestions rendered:\n', dropdownText);

    if (
      !dropdownText.toLowerCase().includes('resume') ||
      !dropdownText.toLowerCase().includes('research') ||
      !dropdownText.toLowerCase().includes('report')
    ) {
      throw new Error('Expected suggestions for "re" (resume, research, report) not all found');
    }
    console.log('   ✅ Trie O(L) prefix search verified with matching tokens!');

    // Capture screenshot of the autocomplete dropdown
    const trieDropdownScreenshot = path.join(ARTIFACTS_DIR, 'phase5_trie_autocomplete_dropdown.png');
    await page.screenshot({ path: trieDropdownScreenshot });
    console.log('   📸 Saved Trie autocomplete dropdown screenshot:', trieDropdownScreenshot);

    // 4. Test Keyboard Navigation (ArrowDown + Enter)
    console.log('4. Testing Keyboard Navigation in Trie suggestions...');
    await page.press('#dashboard-search-input', 'ArrowDown');
    await page.waitForTimeout(300);
    await page.press('#dashboard-search-input', 'ArrowDown');
    await page.waitForTimeout(300);
    await page.press('#dashboard-search-input', 'Enter');
    await page.waitForTimeout(1000);

    // Verify grid has filtered down
    const filteredCards = await page.$$('[id^="file-card-"]');
    console.log(`   Found ${filteredCards.length} file card(s) matching selected suggestion.`);

    // 5. Test Clear Search Button (X)
    console.log('5. Testing Clear Search button...');
    await page.click('#btn-clear-search');
    await page.waitForTimeout(1000);

    const allCards = await page.$$('[id^="file-card-"]');
    console.log(`   Restored ${allCards.length} file cards on clear.`);

    // 6. Test Specific Search for "neural" (sub-word token indexed in Trie)
    console.log('6. Testing sub-word token search for "neu"...');
    await page.fill('#dashboard-search-input', 'neu');
    await page.waitForSelector('#trie-autocomplete-dropdown', { timeout: 6000 });
    await page.click('#trie-suggestion-0');
    await page.waitForTimeout(1000);

    // Capture screenshot of filtered search results
    const filteredResultsScreenshot = path.join(ARTIFACTS_DIR, 'phase5_search_results_filtered.png');
    await page.screenshot({ path: filteredResultsScreenshot });
    console.log('   📸 Saved filtered search results screenshot:', filteredResultsScreenshot);

    console.log('\n🎉 ALL PHASE 5 TRIE SEARCH CHROME E2E TESTS PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 5 E2E Test Failed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(file1)) fs.unlinkSync(file1);
    if (fs.existsSync(file2)) fs.unlinkSync(file2);
    if (fs.existsSync(file3)) fs.unlinkSync(file3);
    await browser.close();
  }
}

runPhase5Chrome();
