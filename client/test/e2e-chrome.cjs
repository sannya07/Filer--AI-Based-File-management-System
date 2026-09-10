const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runChromeE2E() {
  console.log('🚀 Launching Google Chrome (/Applications/Google Chrome.app)...');
  
  let browser;
  try {
    // Try launching Google Chrome with visible window (headed mode)
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 300
    });
  } catch (err) {
    console.log('⚠️ Could not open headed window, launching Google Chrome in headless mode...');
    browser = await chromium.launch({
      channel: 'chrome',
      headless: true
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const testEmail = `chrome_user_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Chrome Tester';

  try {
    console.log('1. Navigating to http://localhost:5173/ on Google Chrome...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('   Redirected to:', page.url());

    // 2. Click Sign Up
    console.log('2. Clicking "Create an account"...');
    await page.click('#link-to-signup');
    await page.waitForURL('**/signup');

    // 3. Fill form
    console.log('3. Typing registration details on Chrome...');
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);

    // 4. Click Submit
    console.log('4. Submitting registration...');
    await page.click('#btn-signup-submit');

    // 5. Verify Dashboard
    console.log('5. Waiting for Dashboard load...');
    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge', { timeout: 10000 });
    console.log('   ✅ User profile active on Chrome Dashboard!');

    const chromeDashboardScreenshot = path.join(ARTIFACTS_DIR, 'chrome_dashboard.png');
    await page.screenshot({ path: chromeDashboardScreenshot });
    console.log('   📸 Saved Chrome Dashboard screenshot:', chromeDashboardScreenshot);

    await page.waitForTimeout(1500);

    // 6. Test Logout
    console.log('6. Logging out...');
    await page.click('#btn-logout');
    await page.waitForURL('**/login');
    console.log('   ✅ Logged out on Chrome!');

    // 7. Test Login
    console.log('7. Logging back in...');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#btn-login-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Re-login verified on Google Chrome!');

    await page.waitForTimeout(1500);

    console.log('\n🎉 GOOGLE CHROME TEST PASSED 100% SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Chrome Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runChromeE2E();
