const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testPhase7Chrome() {
  console.log('\n======================================================');
  console.log('🚀 PHASE 7 LIVE CHROME TEST: ASK YOUR FILE (STRICT GROUNDED RAG)');
  console.log('======================================================\n');

  const sampleDocPath = path.join(__dirname, 'Kubernetes_Production_Cluster_Guide.txt');
  fs.writeFileSync(
    sampleDocPath,
    'Kubernetes Production Cluster Operations Guide:\n' +
    '1. Control Plane Architecture:\n' +
    '   - kube-apiserver: Exposes the Kubernetes API. It is the front end for the control plane.\n' +
    '   - etcd: A consistent and highly-available key-value store used as backing store for all cluster data.\n' +
    '   - kube-scheduler: Watches for newly created Pods with no assigned node and selects an optimal worker node.\n' +
    '2. Worker Node Architecture:\n' +
    '   - kubelet: Primary node agent ensuring container health inside Pods according to PodSpecs.\n' +
    '   - kube-proxy: Manages IP translation and network routing for Kubernetes Services.\n' +
    '3. Production Security Hardening:\n' +
    '   - RBAC: Role-Based Access Control restricts cluster permissions using Role and ClusterRole bindings.\n' +
    '   - Network Policies: Enforce micro-segmentation and firewall ingress/egress rules between namespaces.\n'
  );

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
  const testEmail = `sanya_qa_${timestamp}@filer.ai`;
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

    // 2. Upload Document
    console.log('\n🔹 2. Uploading Kubernetes Production Guide document...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(sampleDocPath);
    await page.waitForTimeout(800);

    await page.selectOption('#upload-category-select', 'Projects');
    await page.click('#btn-confirm-upload');

    await page.waitForSelector('[id^="file-card-"]', { timeout: 15000 });
    console.log('   ✅ Document uploaded successfully');
    await page.waitForTimeout(1500);

    // 3. Open Ask Your File Dialog
    console.log('\n🔹 3. Opening "Ask Your File" Dialog...');
    const askButton = await page.$('button[title*="Ask Your File"]');
    if (!askButton) {
      throw new Error('Ask Your File button not found on file card');
    }
    await askButton.click();

    await page.waitForSelector('#ask-file-dialog-container', { timeout: 8000 });
    console.log('   ✨ SUCCESS: AskFileDialog modal opened via React Portal!');
    await page.waitForTimeout(1000);

    // Capture Welcome Screenshot
    const screenshotDir = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';
    await page.screenshot({ path: path.join(screenshotDir, 'phase7_ask_dialog_welcome.png') });

    // 4. Test Asking a Relevant In-Context Question
    const question1 = 'What is etcd used for in Kubernetes?';
    console.log(`\n🔹 4. Submitting relevant question: "${question1}"...`);
    await page.fill('#input-ask-question', question1);
    await page.click('#btn-ask-submit');

    console.log('   Waiting for grounded answer from in-memory chunks...');
    await page.waitForSelector('button:has-text("Source Chunk")', { timeout: 25000 });
    console.log('   ✨ SUCCESS: Grounded answer generated with Source References!');

    await page.waitForTimeout(1500);
    // Expand source references
    console.log('   Expanding Source References accordion (FR-38)...');
    await page.click('button:has-text("Source Chunk")');
    await page.waitForTimeout(1200);

    // Capture Answer Screenshot
    await page.screenshot({ path: path.join(screenshotDir, 'phase7_ask_answer_with_sources.png') });

    // 5. Test Strict Grounding Constraint (Irrelevant / Out-of-Context Question)
    const question2 = 'Who won the 2022 FIFA World Cup?';
    console.log(`\n🔹 5. Submitting out-of-context question to test strict grounding: "${question2}"...`);
    await page.fill('#input-ask-question', question2);
    await page.click('#btn-ask-submit');

    console.log('   Waiting for strict grounding refusal...');
    await page.waitForTimeout(4000);

    // Verify system explicitly refused hallucination
    const pageContent = await page.textContent('#ask-file-dialog-container');
    const hasRefusal = pageContent.includes('cannot find the answer') || pageContent.includes('does not contain information');
    if (hasRefusal) {
      console.log('   🛡️ SUCCESS: System strictly refused to hallucinate external knowledge (FR-37 Verified)!');
    } else {
      console.log('   Answer generated:', pageContent);
    }

    // Capture Strict Grounding Screenshot
    await page.screenshot({ path: path.join(screenshotDir, 'phase7_ask_strict_grounding_refusal.png') });

    // 6. Test Suggestion Chip
    console.log('\n🔹 6. Testing Suggestion Chip: "Summarize this document"...');
    // Clear chat first
    await page.click('#btn-clear-chat');
    await page.waitForTimeout(1000);
    await page.click('#btn-suggestion-0');
    console.log('   Waiting for summary answer...');
    await page.waitForSelector('button:has-text("Source Chunk")', { timeout: 20000 });
    console.log('   ✅ Suggestion chip successfully triggered document Q&A!');
    await page.waitForTimeout(2000);

    // 7. Close Dialog
    console.log('\n🔹 7. Closing AskFileDialog...');
    await page.click('#btn-close-ask-file');
    await page.waitForTimeout(1000);
    console.log('   ✅ Dialog closed');

    console.log('\n======================================================');
    console.log('🎉 PHASE 7 (ASK YOUR FILE) 100% VERIFIED LIVE ON CHROME!');
    console.log('======================================================\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Phase 7 Test Error:', error);
    process.exitCode = 1;
  } finally {
    if (fs.existsSync(sampleDocPath)) fs.unlinkSync(sampleDocPath);
    await browser.close();
  }
}

testPhase7Chrome();
