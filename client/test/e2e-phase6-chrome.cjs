const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runPhase6Chrome() {
  console.log('🔗 Launching Google Chrome for Phase 6 Sharing & Access Control Testing...');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  // Context 1: Authenticated Owner Context
  const ownerContext = await browser.newContext({
    viewport: { width: 1340, height: 900 }
  });
  const ownerPage = await ownerContext.newPage();

  const testEmail = `share_owner_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Share Test Owner';

  const testFilePath = path.join(__dirname, 'Distributed_Systems_Whitepaper.txt');
  fs.writeFileSync(
    testFilePath,
    'Distributed Systems & Consensus Architecture:\n' +
    'Covers Raft consensus, Paxos protocol, Byzantine fault tolerance, and vector clocks.'
  );

  try {
    // 1. Sign up owner on Chrome
    console.log('1. Signing up owner user on Chrome...');
    await ownerPage.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
    await ownerPage.fill('#signup-name', testName);
    await ownerPage.fill('#signup-email', testEmail);
    await ownerPage.fill('#signup-password', testPassword);
    await ownerPage.click('#btn-signup-submit');

    await ownerPage.waitForURL('http://localhost:5173/');
    await ownerPage.waitForSelector('#user-profile-badge');
    console.log('   ✅ Owner authenticated on Dashboard');

    // 2. Upload test document
    console.log('2. Uploading test document for sharing...');
    await ownerPage.click('#btn-dashboard-upload-cta');
    await ownerPage.waitForSelector('#upload-modal-container');
    const input = await ownerPage.$('#file-upload-input');
    await input.setInputFiles(testFilePath);
    await ownerPage.waitForTimeout(600);
    await ownerPage.selectOption('#upload-category-select', 'Study Material');
    await ownerPage.click('#btn-confirm-upload');

    await ownerPage.waitForSelector('[id^="file-card-"]', { timeout: 15000 });
    console.log('   ✅ Document uploaded successfully');
    await ownerPage.waitForTimeout(1000);

    // 3. Open Share Modal from File Card
    console.log('3. Opening Share Modal from File Card...');
    await ownerPage.click('button[title="Share file"]');
    await ownerPage.waitForSelector('#share-modal-container');
    console.log('   ✅ Share Modal opened!');

    // 4. Configure link: 7 days expiry, View Only
    console.log('4. Configuring share settings: 7 Days Expiry, View Only...');
    await ownerPage.selectOption('#select-share-expiry', '7');
    await ownerPage.click('#btn-perm-viewonly');
    await ownerPage.waitForTimeout(500);

    // Generate link
    console.log('   Clicking "Generate Share Link"...');
    await ownerPage.click('#btn-generate-share-link');
    await ownerPage.waitForSelector('#input-share-url', { timeout: 10000 });

    const shareUrl = await ownerPage.inputValue('#input-share-url');
    console.log(`   ✨ Generated Public Share URL: ${shareUrl}`);

    // Test Copy button
    await ownerPage.click('#btn-copy-share-link');
    await ownerPage.waitForTimeout(600);
    console.log('   ✅ Copy link clicked');

    // Capture screenshot of Share Modal
    const shareModalScreenshot = path.join(ARTIFACTS_DIR, 'phase6_share_modal.png');
    await ownerPage.screenshot({ path: shareModalScreenshot });
    console.log('   📸 Saved Share Modal screenshot:', shareModalScreenshot);

    // 5. Open Unauthenticated Public Context
    console.log('\n5. Opening unauthenticated public recipient context...');
    const publicContext = await browser.newContext({
      viewport: { width: 1200, height: 850 }
    });
    const publicPage = await publicContext.newPage();

    console.log(`   Navigating to ${shareUrl} without login...`);
    await publicPage.goto(shareUrl, { waitUntil: 'networkidle' });

    // Verify public document page renders
    await publicPage.waitForSelector('#public-shared-card', { timeout: 15000 });
    const sharedFileName = await publicPage.textContent('#shared-file-name');
    console.log(`   Public document title: "${sharedFileName.trim()}"`);

    if (!sharedFileName.includes('Distributed_Systems_Whitepaper')) {
      throw new Error('Public file name does not match expected document');
    }

    // Verify View Only indicator is present
    await publicPage.waitForSelector('#view-only-indicator');
    console.log('   ✅ View Only permission enforced publicly!');

    // Capture screenshot of Public Shared Document page
    const publicPageScreenshot = path.join(ARTIFACTS_DIR, 'phase6_public_shared_page.png');
    await publicPage.screenshot({ path: publicPageScreenshot });
    console.log('   📸 Saved Public Shared Page screenshot:', publicPageScreenshot);

    // 6. Test Revoke Link Flow
    console.log('\n6. Testing Link Revocation...');
    // In owner context, click Revoke
    await ownerPage.click('#btn-revoke-share-link');
    await ownerPage.waitForTimeout(1000);
    console.log('   ✅ Link revoked in owner dashboard');

    // In public context, reload the URL
    console.log('   Reloading public URL as recipient after revocation...');
    await publicPage.reload({ waitUntil: 'networkidle' });

    // Verify error card renders
    await publicPage.waitForSelector('#share-error-card', { timeout: 10000 });
    const errorTitle = await publicPage.textContent('#share-error-title');
    console.log(`   Access Denied card rendered with title: "${errorTitle.trim()}"`);

    // Capture screenshot of Revoked Link state
    const revokedScreenshot = path.join(ARTIFACTS_DIR, 'phase6_revoked_link.png');
    await publicPage.screenshot({ path: revokedScreenshot });
    console.log('   📸 Saved Revoked Link screenshot:', revokedScreenshot);

    await publicContext.close();
    await ownerContext.close();

    console.log('\n🎉 ALL PHASE 6 SHARING & ACCESS CONTROL TESTS PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Phase 6 E2E Test Failed:', err);
    process.exit(1);
  } finally {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await browser.close();
  }
}

runPhase6Chrome();
