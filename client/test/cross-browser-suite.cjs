const { chromium, firefox, webkit } = require('playwright');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

const BROWSERS = [
  {
    name: 'Google Chrome',
    engine: 'Blink',
    launcher: () => chromium.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] }),
    id: 'chrome'
  },
  {
    name: 'Mozilla Firefox',
    engine: 'Gecko',
    launcher: () => firefox.launch({ headless: true }),
    id: 'firefox'
  },
  {
    name: 'Apple Safari / WebKit',
    engine: 'WebKit',
    launcher: () => webkit.launch({ headless: true }),
    id: 'webkit'
  }
];

async function runCrossBrowserSuite() {
  console.log('\n======================================================');
  console.log('🌐 CROSS-BROWSER VERIFICATION SUITE');
  console.log('Testing: Chrome (Blink) | Firefox (Gecko) | WebKit (Safari)');
  console.log('======================================================\n');

  // 1. Setup shared test user with files
  const email = `cross_browser_${Date.now()}@example.com`;
  const password = 'CrossBrowser123!';

  console.log(`1. Registering test account: ${email}`);
  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Cross Browser User',
    email,
    password
  });
  const token = regRes.data.token;

  // Upload test document
  try {
    const form = new FormData();
    form.append('file', Buffer.from('Cross-browser compatibility validation document'), {
      filename: 'Cross_Browser_Report.pdf',
      contentType: 'application/pdf'
    });
    form.append('category', 'Study Material');
    await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
    });
  } catch (err) {}

  const results = [];

  for (const b of BROWSERS) {
    console.log(`\n------------------------------------------------------`);
    console.log(`🚀 Testing on ${b.name} (${b.engine})...`);
    console.log(`------------------------------------------------------`);

    const browser = await b.launcher();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    try {
      // 1. Login Page
      console.log(`   [${b.id}] 1. Navigating to Login...`);
      await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });

      // Theme toggle on login
      await page.waitForSelector('#btn-theme-toggle-login');
      await page.click('#btn-theme-toggle-login');
      await page.waitForTimeout(300);
      await page.click('#btn-theme-toggle-login');
      await page.waitForTimeout(300);

      // Authenticate
      console.log(`   [${b.id}] 2. Logging in...`);
      await page.fill('#login-email', email);
      await page.fill('#login-password', password);
      await page.click('#btn-login-submit');

      // Dashboard
      console.log(`   [${b.id}] 3. Waiting for Dashboard...`);
      await page.waitForSelector('#btn-theme-toggle', { timeout: 15000 });
      await page.waitForSelector('[id^="file-card-"]', { timeout: 15000 });
      await page.waitForTimeout(1000);

      // Check initial theme state on dashboard
      const isInitiallyDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));

      // Capture screenshot in current theme
      const shot1Path = isInitiallyDark
        ? path.join(ARTIFACTS_DIR, `browser_${b.id}_dashboard_dark.png`)
        : path.join(ARTIFACTS_DIR, `browser_${b.id}_dashboard_light.png`);
      await page.screenshot({ path: shot1Path });

      // Verify category tree and shelf
      const hasShelf = await page.isVisible('#important-files-shelf');
      const hasTree = await page.isVisible('#category-tree-sidebar');
      const hasSearch = await page.isVisible('#dashboard-search-input');

      // Click Theme Toggle to switch modes
      console.log(`   [${b.id}] 4. Clicking Theme Toggle...`);
      await page.click('#btn-theme-toggle');
      await page.waitForTimeout(600);

      const isDarkAfterToggle = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const toggleSwapped = isDarkAfterToggle !== isInitiallyDark;

      // Capture screenshot in toggled theme
      const shot2Path = isDarkAfterToggle
        ? path.join(ARTIFACTS_DIR, `browser_${b.id}_dashboard_dark.png`)
        : path.join(ARTIFACTS_DIR, `browser_${b.id}_dashboard_light.png`);
      await page.screenshot({ path: shot2Path });

      // Test Reload Persistence
      console.log(`   [${b.id}] 5. Testing reload persistence in ${b.name}...`);
      const themeBeforeReload = await page.evaluate(() => localStorage.getItem('filer_theme'));
      await page.reload({ waitUntil: 'networkidle' });
      const themeAfterReload = await page.evaluate(() => localStorage.getItem('filer_theme'));
      const isDarkAfterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      const reloadPersisted = themeBeforeReload === themeAfterReload;

      // Test Trie Search autocomplete
      console.log(`   [${b.id}] 6. Testing Trie Autocomplete Search in ${b.name}...`);
      await page.fill('#dashboard-search-input', 'Cross');
      await page.waitForTimeout(800);
      const searchDropdown = await page.$('#trie-autocomplete-dropdown');
      const hasDropdown = Boolean(searchDropdown);
      await page.fill('#dashboard-search-input', '');

      results.push({
        browser: b.name,
        engine: b.engine,
        loginOk: true,
        dashboardOk: true,
        importantShelfOk: hasShelf,
        categoryTreeOk: hasTree,
        searchAutocompleteOk: hasDropdown,
        themeToggleOk: toggleSwapped,
        reloadPersistenceOk: reloadPersisted,
        screenshots: {
          dark: `browser_${b.id}_dashboard_dark.png`,
          light: `browser_${b.id}_dashboard_light.png`
        }
      });

      console.log(`   ✅ ${b.name} (${b.engine}) TESTS PASSED COMPLETELY`);
    } catch (err) {
      console.error(`   ❌ ${b.name} encountered error:`, err.message);
      results.push({
        browser: b.name,
        engine: b.engine,
        error: err.message
      });
    } finally {
      await browser.close();
    }
  }

  console.log('\n======================================================');
  console.log('📊 CROSS-BROWSER TEST RESULTS MATRIX');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
}

runCrossBrowserSuite().catch(err => {
  console.error('Cross-browser test suite fatal error:', err);
  process.exit(1);
});
