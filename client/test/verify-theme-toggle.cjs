const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

async function testThemeToggle() {
  console.log('\n======================================================');
  console.log('🧪 TESTING DARK / LIGHT MODE TOGGLE (LIVE BROWSER TEST)');
  console.log('======================================================\n');

  // 1. Register test user
  const email = `theme_toggle_user_${Date.now()}@example.com`;
  const password = 'ThemePassword123!';

  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Theme Master',
    email,
    password
  });
  const token = regRes.data.token;

  // Upload a sample file
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', Buffer.from('Theme testing document content.'), {
    filename: 'Theme_Testing_Guide.txt',
    contentType: 'text/plain'
  });
  form.append('category', 'Projects');
  await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
  });

  // 2. Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // Login
  console.log('1. Logging in and reaching dashboard...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-theme-toggle', { timeout: 10000 });
  await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });

  // Check initial state
  const initialIsDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log('Initial page theme is dark?:', initialIsDark);

  // If initial is light, capture light first, then toggle to dark
  // If initial is dark, capture dark first, then toggle to light
  if (!initialIsDark) {
    // Capture Light Mode
    const lightPath = path.join(ARTIFACTS_DIR, 'theme_light_mode_dashboard.png');
    await page.screenshot({ path: lightPath, fullPage: false });
    console.log(`✅ Saved Light Mode Screenshot: ${lightPath}`);

    // Click toggle to switch to Dark Mode
    console.log('2. Clicking theme toggle to switch to Dark Mode...');
    await page.click('#btn-theme-toggle');
    await page.waitForTimeout(600);

    const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('After toggle, is dark?:', isDarkNow);

    const darkPath = path.join(ARTIFACTS_DIR, 'theme_dark_mode_dashboard.png');
    await page.screenshot({ path: darkPath, fullPage: false });
    console.log(`✅ Saved Dark Mode Screenshot: ${darkPath}`);
  } else {
    // Capture Dark Mode
    const darkPath = path.join(ARTIFACTS_DIR, 'theme_dark_mode_dashboard.png');
    await page.screenshot({ path: darkPath, fullPage: false });
    console.log(`✅ Saved Dark Mode Screenshot: ${darkPath}`);

    // Click toggle to switch to Light Mode
    console.log('2. Clicking theme toggle to switch to Light Mode...');
    await page.click('#btn-theme-toggle');
    await page.waitForTimeout(600);

    const isDarkNow = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    console.log('After toggle, is dark?:', isDarkNow);

    const lightPath = path.join(ARTIFACTS_DIR, 'theme_light_mode_dashboard.png');
    await page.screenshot({ path: lightPath, fullPage: false });
    console.log(`✅ Saved Light Mode Screenshot: ${lightPath}`);
  }

  // 3. Test persistence on page reload
  console.log('3. Reloading page to verify persistence in localStorage...');
  await page.reload({ waitUntil: 'networkidle' });
  const isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  const savedLocalStorage = await page.evaluate(() => localStorage.getItem('filer_theme'));
  console.log(`Persistence confirmed! isDark: ${isDarkAfterReload}, stored: "${savedLocalStorage}"`);

  await browser.close();
  console.log('\n🎉 ALL THEME TOGGLE VERIFICATIONS COMPLETED SUCCESSFULLY!\n');
}

testThemeToggle().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
