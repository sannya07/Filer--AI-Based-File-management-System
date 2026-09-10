const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runE2E() {
  console.log('🚀 Launching automated Playwright browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const testEmail = `automation_${Date.now()}@filer.ai`;
  const testPassword = 'Password123!';
  const testName = 'Automation Tester';

  try {
    // 1. Visit root URL -> should redirect to /login
    console.log('1. Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('   Current URL:', page.url());

    if (!page.url().includes('/login')) {
      throw new Error(`Expected redirect to /login, but got ${page.url()}`);
    }

    // Capture Login Page Screenshot
    const loginScreenshot = path.join(ARTIFACTS_DIR, 'login_page.png');
    await page.screenshot({ path: loginScreenshot });
    console.log('   📸 Saved Login screenshot:', loginScreenshot);

    // 2. Click link to Signup
    console.log('2. Clicking link to Sign Up...');
    await page.click('#link-to-signup');
    await page.waitForURL('**/signup');
    console.log('   Current URL:', page.url());

    // Capture Signup Page Screenshot
    const signupScreenshot = path.join(ARTIFACTS_DIR, 'signup_page.png');
    await page.screenshot({ path: signupScreenshot });
    console.log('   📸 Saved Signup screenshot:', signupScreenshot);

    // 3. Fill and submit Signup form
    console.log('3. Filling Signup form...');
    await page.fill('#signup-name', testName);
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', testPassword);

    console.log('4. Submitting registration...');
    await page.click('#btn-signup-submit');

    // 4. Wait for redirect to Dashboard (/)
    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge', { timeout: 10000 });
    console.log('   ✅ Redirection to Dashboard succeeded!');

    // Wait a brief moment for dashboard animations
    await page.waitForTimeout(1000);

    // Capture Dashboard Screenshot
    const dashboardScreenshot = path.join(ARTIFACTS_DIR, 'dashboard_page.png');
    await page.screenshot({ path: dashboardScreenshot });
    console.log('   📸 Saved Dashboard screenshot:', dashboardScreenshot);

    // 5. Test Logout
    console.log('5. Clicking Logout...');
    await page.click('#btn-logout');
    await page.waitForURL('**/login');
    console.log('   ✅ Logout successful, returned to /login');

    // 6. Test Login with newly created user
    console.log('6. Logging back in with new account...');
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#btn-login-submit');

    await page.waitForURL('http://localhost:5173/');
    await page.waitForSelector('#user-profile-badge');
    console.log('   ✅ Re-login succeeded!');

    console.log('\n🎉 ALL AUTOMATED BROWSER E2E TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2E();
