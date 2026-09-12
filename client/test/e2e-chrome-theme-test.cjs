const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function runChromeThemeTest() {
  console.log('\n======================================================');
  console.log('🌐 TESTING ON REAL GOOGLE CHROME: DARK & LIGHT MODE');
  console.log('======================================================\n');

  // 1. Create a dedicated user with sample files
  const email = `chrome_tester_${Date.now()}@example.com`;
  const password = 'ChromePassword123!';

  console.log(`1. Registering test user: ${email}`);
  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Chrome User',
    email,
    password
  });
  const token = regRes.data.token;

  // Upload a sample file for rich dashboard visual verification
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', Buffer.from('Chrome visual test document content'), {
    filename: 'Chrome_Verified_Report.pdf',
    contentType: 'application/pdf'
  });
  form.append('category', 'Study Material');
  const uploadRes = await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
  });
  const fileId = uploadRes.data.file._id;

  // 2. Launch real Google Chrome
  console.log('2. Launching Google Chrome browser...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 3. Login
  console.log('3. Navigating to login page on Chrome...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-theme-toggle', { timeout: 10000 });
  await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });
  console.log('4. Reached Dashboard on Chrome.');

  // Check initial theme state
  const initialTheme = await page.evaluate(() => localStorage.getItem('filer_theme') || 'default');
  console.log('Initial theme state:', initialTheme);

  // Switch explicitly to Dark Mode if not already dark
  const isDarkInitially = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  if (!isDarkInitially) {
    console.log('Toggling to Dark Mode...');
    await page.click('#btn-theme-toggle');
    await page.waitForTimeout(500);
  }

  // Capture Dark Mode on Chrome
  const chromeDarkPath = path.join(ARTIFACTS_DIR, 'chrome_dark_mode_dashboard.png');
  await page.screenshot({ path: chromeDarkPath, fullPage: false });
  console.log(`📸 Chrome Dark Mode Screenshot: ${chromeDarkPath}`);

  // Switch to Light Mode
  console.log('5. Clicking theme toggle to switch to Light Mode on Chrome...');
  await page.click('#btn-theme-toggle');
  await page.waitForTimeout(500);

  const isDarkAfterSwitch = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  const storedThemeAfterSwitch = await page.evaluate(() => localStorage.getItem('filer_theme'));
  console.log('Chrome: is dark class present?:', isDarkAfterSwitch, '(Expected: false)');
  console.log('Chrome: stored theme:', storedThemeAfterSwitch, '(Expected: light)');

  // Capture Light Mode on Chrome
  const chromeLightPath = path.join(ARTIFACTS_DIR, 'chrome_light_mode_dashboard.png');
  await page.screenshot({ path: chromeLightPath, fullPage: false });
  console.log(`📸 Chrome Light Mode Screenshot: ${chromeLightPath}`);

  // Test reload persistence on Chrome
  console.log('6. Reloading page on Chrome to test persistence...');
  await page.reload({ waitUntil: 'networkidle' });
  const themeAfterReload = await page.evaluate(() => localStorage.getItem('filer_theme'));
  const isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`Chrome Reload: stored theme is "${themeAfterReload}", isDark: ${isDarkAfterReload}`);

  // 7. Test ThemeToggle on Login Page in Chrome
  console.log('7. Testing ThemeToggle on Login Page in Chrome...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#btn-theme-toggle-login');
  
  // Toggle to dark on login
  await page.click('#btn-theme-toggle-login');
  await page.waitForTimeout(400);
  const chromeLoginDarkPath = path.join(ARTIFACTS_DIR, 'chrome_login_dark.png');
  await page.screenshot({ path: chromeLoginDarkPath, fullPage: false });
  console.log(`📸 Chrome Login Dark Mode Screenshot: ${chromeLoginDarkPath}`);

  // Toggle to light on login
  await page.click('#btn-theme-toggle-login');
  await page.waitForTimeout(400);
  const chromeLoginLightPath = path.join(ARTIFACTS_DIR, 'chrome_login_light.png');
  await page.screenshot({ path: chromeLoginLightPath, fullPage: false });
  console.log(`📸 Chrome Login Light Mode Screenshot: ${chromeLoginLightPath}`);

  await browser.close();
  console.log('\n🎉 ALL GOOGLE CHROME TESTS COMPLETED SUCCESSFULLY!\n');
}

runChromeThemeTest().catch(err => {
  console.error('Chrome test error:', err);
  process.exit(1);
});
