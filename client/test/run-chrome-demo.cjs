const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runVisibleChromeDemo() {
  console.log('🌟 Opening live Google Chrome window for you to watch...');

  // Create sample document
  const sampleFilePath = path.join(__dirname, 'AWS_Cloud_Security_Guide.txt');
  fs.writeFileSync(
    sampleFilePath,
    'FILER AI - AWS Cloud Security Guide\n\n' +
    '1. Identity and Access Management (IAM):\n' +
    '   - Enforce multi-factor authentication (MFA).\n' +
    '   - Follow the principle of least privilege.\n\n' +
    '2. Amazon S3 Bucket Protection:\n' +
    '   - Block public access by default.\n' +
    '   - Enable server-side encryption with KMS.\n\n' +
    '3. Virtual Private Cloud (VPC):\n' +
    '   - Segment public and private subnets.\n' +
    '   - Configure Security Groups and Network ACLs.\n'
  );

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false, // Visible window on Mac!
      slowMo: 700 // Smooth visible speed
    });
  } catch (err) {
    console.log('Falling back to bundled Chromium headed window...');
    browser = await chromium.launch({
      headless: false,
      slowMo: 700
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  const testEmail = `sanya_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Sanya Kansal';

  try {
    // 1. Visit Login
    console.log('1. Loading FILER AI...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // 2. Click Sign Up
    console.log('2. Navigating to Sign Up screen...');
    await page.click('#link-to-signup');
    await page.waitForURL('**/signup');

    // 3. Fill Signup
    console.log('3. Entering account information...');
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);

    // 4. Submit
    console.log('4. Submitting registration...');
    await page.click('#btn-signup-submit');

    // 5. Dashboard
    console.log('5. Waiting for Workspace Dashboard...');
    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');

    // Pause briefly to enjoy the dashboard
    await page.waitForTimeout(1500);

    // 6. Open Upload Modal
    console.log('6. Clicking "Upload New File"...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    // 7. Choose file
    console.log('7. Selecting AWS Cloud Security Guide document...');
    const fileInput = await page.$('#file-upload-input');
    await fileInput.setInputFiles(sampleFilePath);

    await page.waitForTimeout(1200);

    // 8. Select category
    console.log('8. Selecting category "Study Material"...');
    await page.selectOption('#upload-category-select', 'Study Material');

    await page.waitForTimeout(1000);

    // 9. Click Upload
    console.log('9. Uploading document to Cloud Storage...');
    await page.click('#btn-confirm-upload');

    // 10. Verify FileCard
    console.log('10. Document uploaded! Verifying FileCard in grid...');
    await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });

    await page.waitForTimeout(2000);

    // 11. Test Duplicate Detection (DSA AR-1)
    console.log('11. Opening Upload Modal again to test Duplicate Detection...');
    await page.click('#btn-dashboard-upload-cta');
    await page.waitForSelector('#upload-modal-container');

    console.log('12. Selecting the EXACT SAME file to trigger duplicate hash check...');
    const fileInput2 = await page.$('#file-upload-input');
    await fileInput2.setInputFiles(sampleFilePath);

    // Wait for the duplicate detection warning banner
    await page.waitForSelector('#duplicate-warning-banner', { timeout: 10000 });
    console.log('    ✅ "Possible Duplicate Detected" warning banner is visible on your screen!');

    // Keep it on screen for 4 seconds so the user can read it
    await page.waitForTimeout(4000);

    console.log('13. Clicking "Cancel" on duplicate upload...');
    await page.click('#btn-cancel-upload');

    // Keep the final dashboard open for 5 seconds for the user to see
    console.log('14. Showing final workspace with uploaded files...');
    await page.waitForTimeout(5000);

    console.log('\n🎉 VISIBLE CHROME DEMO COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Demo Error:', err);
  } finally {
    if (fs.existsSync(sampleFilePath)) {
      fs.unlinkSync(sampleFilePath);
    }
    await browser.close();
  }
}

runVisibleChromeDemo();
