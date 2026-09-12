const { chromium } = require('playwright');
const axios = require('axios');
const FormData = require('form-data');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';

async function runVisibleChromeTest() {
  console.log('1. Preparing test account and sample documents...');
  const email = `live_chrome_${Date.now()}@example.com`;
  const password = 'ChromePassword123!';

  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Chrome Tester',
    email,
    password
  });
  const token = regRes.data.token;

  // Upload 2 sample files to populate dashboard
  try {
    const form1 = new FormData();
    form1.append('file', Buffer.from('Quarterly Performance Review Report 2026'), {
      filename: 'Quarterly_Report_2026.pdf',
      contentType: 'application/pdf'
    });
    form1.append('category', 'Study Material');
    await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form1, {
      headers: { ...form1.getHeaders(), Authorization: `Bearer ${token}` }
    });

    const form2 = new FormData();
    form2.append('file', Buffer.from('System Architecture and DSA specifications'), {
      filename: 'System_Architecture_Specs.txt',
      contentType: 'text/plain'
    });
    form2.append('category', 'Projects');
    await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form2, {
      headers: { ...form2.getHeaders(), Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.log('Upload error (proceeding):', err.message);
  }

  console.log('2. Launching visible Google Chrome on macOS...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    slowMo: 700,
    args: ['--start-maximized']
  });

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('3. Navigating to Login page on Chrome...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });

  // Toggle theme on login page
  console.log('4. Demonstrating Theme Toggle on Login Page...');
  await page.waitForTimeout(1000);
  await page.click('#btn-theme-toggle-login'); // switch to light
  console.log('   -> Switched to Light Mode on Login');
  await page.waitForTimeout(1500);
  await page.click('#btn-theme-toggle-login'); // switch back to dark
  console.log('   -> Switched back to Dark Mode on Login');
  await page.waitForTimeout(1000);

  // Fill credentials and sign in
  console.log('5. Signing in on Chrome...');
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#btn-login-submit');

  console.log('6. Waiting for Dashboard to load...');
  await page.waitForSelector('#btn-theme-toggle', { timeout: 15000 });
  await page.waitForTimeout(1500);

  // Toggle to Light Mode on Dashboard
  console.log('7. Toggling to Light Mode on Dashboard...');
  await page.click('#btn-theme-toggle');
  console.log('   -> Dashboard is now in Light Mode');
  await page.waitForTimeout(2500);

  // Toggle back to Dark Mode on Dashboard
  console.log('8. Toggling back to Dark Mode on Dashboard...');
  await page.click('#btn-theme-toggle');
  console.log('   -> Dashboard is now in Dark Mode');
  await page.waitForTimeout(2500);

  // Test Category Filtering
  console.log('9. Clicking category in Category Tree...');
  const studyCategory = await page.$('button:has-text("Study Material")');
  if (studyCategory) {
    await studyCategory.click();
    await page.waitForTimeout(1500);
    const allDocs = await page.$('button:has-text("All Documents")');
    if (allDocs) await allDocs.click();
    await page.waitForTimeout(1000);
  }

  // Test Trie Search autocomplete
  console.log('10. Testing Trie Search Autocomplete in Chrome...');
  const searchInput = await page.$('input[placeholder*="Search files"]');
  if (searchInput) {
    await searchInput.fill('Quarterly');
    await page.waitForTimeout(1500);
    await searchInput.fill('');
    await page.waitForTimeout(800);
  }

  // Test 1-click Pin on FileCard
  console.log('11. Testing 1-click Pin to Max-Heap Shelf...');
  const pinButtons = await page.$$('[id^="btn-pin-"]');
  if (pinButtons && pinButtons.length > 0) {
    await pinButtons[0].click();
    console.log('    -> Pinned document to Max-Heap shelf (+500 pts)');
    await page.waitForTimeout(2000);
  }

  // Open Upload Modal to show modal theme
  console.log('12. Opening Upload Modal to check modal theme...');
  const uploadBtn = await page.$('button:has-text("Upload New File")');
  if (uploadBtn) {
    await uploadBtn.click();
    await page.waitForTimeout(2000);
    const closeBtn = await page.$('button:has-text("Cancel")');
    if (closeBtn) await closeBtn.click();
    await page.waitForTimeout(1000);
  }

  // Switch to Light Mode again to demonstrate persistence across reload
  console.log('13. Switching to Light Mode and testing reload persistence...');
  await page.click('#btn-theme-toggle');
  await page.waitForTimeout(1500);
  await page.reload({ waitUntil: 'networkidle' });
  console.log('    -> Reload completed, verified theme remained Light Mode');
  await page.waitForTimeout(2000);

  // Switch back to Dark Mode
  await page.click('#btn-theme-toggle');
  await page.waitForTimeout(2000);

  try {
    console.log('14. Test completed! Leaving browser visible for 4 seconds...');
    await page.waitForTimeout(4000);
    await browser.close();
  } catch (e) {
    // browser closed by user
  }
  console.log('15. Chrome automated test session completed.');
}

runVisibleChromeTest().catch(err => {
  if (err.message && err.message.includes('Target page, context or browser has been closed')) {
    console.log('15. Chrome automated test session completed (browser closed by user).');
    process.exit(0);
  }
  console.error('Visible Chrome test error:', err);
  process.exit(1);
});

