const { chromium } = require('playwright');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const BASE_URL_SERVER = 'http://localhost:5000';
const BASE_URL_CLIENT = 'http://localhost:5173';

async function testDownloadBehavior() {
  console.log('\n======================================================');
  console.log('🧪 TESTING FILE DOWNLOAD BEHAVIOR (SHARED PAGE + DASHBOARD)');
  console.log('======================================================\n');

  // 1. Register test user
  const email = `download_test_${Date.now()}@example.com`;
  const password = 'StrongPassword123!';
  const regRes = await axios.post(`${BASE_URL_SERVER}/api/auth/register`, {
    name: 'Download Tester',
    email,
    password
  });
  const token = regRes.data.token;

  // 2. Upload a sample file
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', Buffer.from('Quarterly Financial Summary Content For Download Test'), {
    filename: 'Quarterly_Financial_Report.txt',
    contentType: 'text/plain'
  });
  form.append('category', 'Projects');

  const uploadRes = await axios.post(`${BASE_URL_SERVER}/api/files/upload`, form, {
    headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
  });
  const uploadedFile = uploadRes.data.file;
  console.log('Uploaded file:', uploadedFile.fileName, 'ID:', uploadedFile._id);

  // 3. Generate a public share link
  const shareRes = await axios.post(`${BASE_URL_SERVER}/api/share/create`, {
    fileId: uploadedFile._id,
    viewOnly: false
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const shareToken = shareRes.data.shareLink.token;
  console.log('Created share link token:', shareToken);

  // 4. Launch browser and test Shared Page download
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    colorScheme: 'dark'
  });
  const page = await context.newPage();

  console.log('\nTesting Public Share Page Download...');
  await page.goto(`${BASE_URL_CLIENT}/share/${shareToken}`, { waitUntil: 'networkidle' });

  await page.waitForSelector('#btn-public-download');

  // Listen for browser download event
  const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.click('#btn-public-download');
  const download = await downloadPromise;

  const downloadedName = download.suggestedFilename();
  console.log(`✅ Public Share page download SUCCESS! Filename: ${downloadedName}`);

  // 5. Test Dashboard FileCard download button
  console.log('\nTesting Dashboard FileCard Download...');
  await page.goto(`${BASE_URL_CLIENT}/login`, { waitUntil: 'networkidle' });
  await page.fill('#login-email', email);
  await page.fill('#login-password', password);
  await page.click('#btn-login-submit');

  await page.waitForSelector(`[id="file-card-${uploadedFile._id}"]`, { timeout: 10000 });

  const cardDownloadPromise = page.waitForEvent('download', { timeout: 10000 });
  await page.click(`#btn-download-file-${uploadedFile._id}`);
  const cardDownload = await cardDownloadPromise;

  const cardDownloadedName = cardDownload.suggestedFilename();
  console.log(`✅ Dashboard FileCard download SUCCESS! Filename: ${cardDownloadedName}`);

  // Clean up downloaded files
  await download.cancel().catch(() => {});
  await cardDownload.cancel().catch(() => {});

  await browser.close();
  console.log('\n🎉 ALL DOWNLOAD TESTS PASSED SUCCESSFULLY! Files download to disk directly.\n');
}

testDownloadBehavior().catch(err => {
  console.error('Download verification error:', err);
  process.exit(1);
});
