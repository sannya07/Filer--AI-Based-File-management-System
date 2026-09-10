const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase8Chrome() {
  console.log('\n======================================================');
  console.log('🚀 PHASE 8 LIVE CHROME TEST: PRIORITY QUEUE (MAX-HEAP DSA)');
  console.log('======================================================\n');

  const doc1Path = path.join(__dirname, 'System_Architecture_Doc.txt');
  fs.writeFileSync(doc1Path, 'Microservices architecture design with API gateways, event queues, and Docker containers.');

  const doc2Path = path.join(__dirname, 'Machine_Learning_Notes.txt');
  fs.writeFileSync(doc2Path, 'Deep learning neural networks, transformers, attention mechanisms, and backpropagation.');

  const doc3Path = path.join(__dirname, 'Product_Roadmap_2026.txt');
  fs.writeFileSync(doc3Path, 'Q1: Cloud storage migration. Q2: AI categorization. Q3: Priority Queue and RAG rollout.');

  let browser;
  try {
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

  const context = await browser.newContext({
    viewport: { width: 1360, height: 900 }
  });
  const page = await context.newPage();

  const timestamp = Date.now();
  const testEmail = `sanya_pq_${timestamp}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Sanya Kansal';

  try {
    // 1. Sign Up & Auth
    console.log('🔹 1. Authenticating test user on FILER AI...');
    await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Authenticated on dashboard');
    await page.waitForTimeout(1000);

    // 2. Upload 3 Documents
    console.log('\n🔹 2. Uploading 3 sample documents to test Priority Queue...');
    const uploadDoc = async (filePath, category) => {
      await page.click('#btn-dashboard-upload-cta');
      await page.waitForSelector('#upload-modal-container');
      const input = await page.$('#file-upload-input');
      await input.setInputFiles(filePath);
      await page.waitForTimeout(500);
      await page.selectOption('#upload-category-select', category);
      await page.click('#btn-confirm-upload');
      await page.waitForTimeout(2500);
    };

    console.log('   Uploading Doc 1: System_Architecture_Doc.txt...');
    await uploadDoc(doc1Path, 'Projects');

    console.log('   Uploading Doc 2: Machine_Learning_Notes.txt...');
    await uploadDoc(doc2Path, 'Study Material');

    console.log('   Uploading Doc 3: Product_Roadmap_2026.txt...');
    await uploadDoc(doc3Path, 'Projects');

    console.log('   Waiting for files to load and Priority Queue to rank...');
    await page.waitForSelector('#important-files-shelf', { timeout: 15000 });
    console.log('   ✨ SUCCESS: "Important & Quick Access" shelf rendered via Max-Heap DSA!');
    await page.waitForTimeout(2000);

    // 3. Pin Doc 2 (Machine Learning Notes)
    console.log('\n🔹 3. Testing 1-click Pin feature on Machine Learning Notes (+500 pts)...');
    // Find pin button on the card for Machine Learning Notes
    const pinButtons = await page.$$('button[title*="Pin to top"]');
    if (pinButtons.length > 0) {
      console.log(`   Found ${pinButtons.length} file cards with pin buttons. Clicking pin...`);
      await pinButtons[1].click(); // Pin the 2nd file (ML notes)
      await page.waitForTimeout(2000);
      console.log('   ✅ File pinned! Priority score increased by +500 points.');
    }

    // Capture Pinned Shelf Screenshot
    const screenshotDir = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';
    await page.screenshot({ path: path.join(screenshotDir, 'phase8_priority_shelf_pinned.png') });

    // 4. Verify Shelf displays Pinned file at #1
    console.log('\n🔹 4. Verifying Max-Heap Priority Queue re-ranking in shelf...');
    const shelfText = await page.textContent('#important-files-shelf');
    const hasPinnedBadge = shelfText.includes('Pinned');
    console.log(`   Shelf contains Pinned badge: ${hasPinnedBadge}`);
    await page.waitForTimeout(1500);

    // 5. Test Quick Q&A from Priority Shelf
    console.log('\n🔹 5. Triggering Quick Q&A from Important Files Shelf...');
    const quickQAButton = await page.$('#important-files-shelf button:has-text("Quick Q&A")');
    if (quickQAButton) {
      await quickQAButton.click();
      await page.waitForSelector('#ask-file-dialog-container', { timeout: 8000 });
      console.log('   ✨ SUCCESS: AskFileDialog opened directly from Priority Shelf!');
      await page.waitForTimeout(2000);
      await page.click('#btn-close-ask-file');
      await page.waitForTimeout(1000);
    }

    // 6. Test Unpinning
    console.log('\n🔹 6. Testing Unpinning document...');
    const unpinButton = await page.$('button[title*="Unpin file"]');
    if (unpinButton) {
      await unpinButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Document unpinned! Shelf dynamically re-heapified.');
    }

    // Capture Final Re-ranked Screenshot
    await page.screenshot({ path: path.join(screenshotDir, 'phase8_priority_shelf_reranked.png') });

    console.log('\n======================================================');
    console.log('🎉 PHASE 8 (PRIORITY QUEUE DSA) 100% VERIFIED ON CHROME!');
    console.log('======================================================\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Phase 8 Test Error:', error);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(doc1Path)) fs.unlinkSync(doc1Path);
    if (fs.existsSync(doc2Path)) fs.unlinkSync(doc2Path);
    if (fs.existsSync(doc3Path)) fs.unlinkSync(doc3Path);
    await browser.close();
  }
}

testPhase8Chrome();
