const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');
const FormData = require('form-data');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';
const ARTIFACTS_DIR = '/Users/sanyakansal/.gemini/antigravity-ide/brain/5982a80a-56ae-43e3-8fea-6bdd6cf35dc4';

const VIEWPORTS = [
  { name: 'mobile_small', label: 'Mobile Small (360x740)', width: 360, height: 740 },
  { name: 'mobile_standard', label: 'Mobile Standard (390x844)', width: 390, height: 844 },
  { name: 'tablet', label: 'Tablet (768x1024)', width: 768, height: 1024 },
  { name: 'desktop', label: 'Desktop (1440x900)', width: 1440, height: 900 }
];

async function checkResponsiveness() {
  console.log('\n======================================================');
  console.log('📱 TESTING MULTI-VIEWPORT RESPONSIVENESS ACROSS THE APP');
  console.log('======================================================\n');

  // Register a test user and upload files
  const email = `responsive_${Date.now()}@example.com`;
  const password = 'ResponsivePassword123!';

  console.log('1. Setting up test account and files...');
  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Sanya Kansal',
    email,
    password
  });
  const token = regRes.data.token;

  try {
    const form1 = new FormData();
    form1.append('file', Buffer.from('Quarterly Financial Audit and Tax Overview 2026'), {
      filename: 'Financial_Audit_2026.pdf',
      contentType: 'application/pdf'
    });
    form1.append('category', 'Projects');
    await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form1, {
      headers: { ...form1.getHeaders(), Authorization: `Bearer ${token}` }
    });
  } catch (e) {}

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox']
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.label} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    // 1. Check Login Page responsiveness
    await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
    const loginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const loginShot = path.join(ARTIFACTS_DIR, `responsive_login_${vp.name}.png`);
    await page.screenshot({ path: loginShot });

    // Perform Login
    await page.fill('#login-email', email);
    await page.fill('#login-password', password);
    await page.click('#btn-login-submit');

    // Wait for Dashboard
    await page.waitForSelector('#btn-theme-toggle', { timeout: 10000 });
    await page.waitForSelector('[id^="file-card-"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // 2. Check Dashboard in Dark Mode
    const darkOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);

    const darkShot = path.join(ARTIFACTS_DIR, `responsive_dashboard_dark_${vp.name}.png`);
    await page.screenshot({ path: darkShot, fullPage: false });

    // 3. Check Navbar layout integrity
    const navbarRect = await page.evaluate(() => {
      const el = document.querySelector('header');
      return el ? { width: el.offsetWidth, scrollWidth: el.scrollWidth } : null;
    });

    // 4. Toggle to Light Mode
    await page.click('#btn-theme-toggle');
    await page.waitForTimeout(500);
    const lightShot = path.join(ARTIFACTS_DIR, `responsive_dashboard_light_${vp.name}.png`);
    await page.screenshot({ path: lightShot, fullPage: false });

    // 5. Check Upload Modal Responsiveness
    const uploadBtn = await page.$('#btn-dashboard-upload-cta');
    let modalOverflow = false;
    let modalShot = null;
    if (uploadBtn) {
      await uploadBtn.click();
      await page.waitForTimeout(600);
      modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      modalShot = path.join(ARTIFACTS_DIR, `responsive_modal_${vp.name}.png`);
      await page.screenshot({ path: modalShot, fullPage: false });
      // Close modal
      const closeBtn = await page.$('button:has-text("Cancel")');
      if (closeBtn) await closeBtn.click();
    }

    results.push({
      viewport: vp.label,
      width: vp.width,
      height: vp.height,
      hasHorizontalOverflow: darkOverflow || loginOverflow || modalOverflow,
      scrollWidth,
      innerWidth,
      navbarOverflow: navbarRect ? navbarRect.scrollWidth > navbarRect.width : false,
      screenshots: {
        login: `responsive_login_${vp.name}.png`,
        dashboardDark: `responsive_dashboard_dark_${vp.name}.png`,
        dashboardLight: `responsive_dashboard_light_${vp.name}.png`,
        modal: `responsive_modal_${vp.name}.png`
      }
    });

    console.log(`Viewport ${vp.label}:`);
    console.log(`  - Horizontal Overflow: ${darkOverflow ? '⚠️ YES' : '✅ NO'} (scrollWidth: ${scrollWidth}px vs window: ${innerWidth}px)`);
    console.log(`  - Navbar Overflow: ${navbarRect && navbarRect.scrollWidth > navbarRect.width ? '⚠️ YES' : '✅ NO'}`);
    console.log(`  - Login Overflow: ${loginOverflow ? '⚠️ YES' : '✅ NO'}`);
    console.log(`  - Modal Overflow: ${modalOverflow ? '⚠️ YES' : '✅ NO'}`);

    await context.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('📊 RESPONSIVENESS EVALUATION SUMMARY');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
}

checkResponsiveness().catch(err => {
  console.error('Responsiveness check error:', err);
  process.exit(1);
});
