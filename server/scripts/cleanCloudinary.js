const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const targetCloudName = process.argv[2] || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

async function cleanCloudinary() {
  if (!targetCloudName || targetCloudName === 'your_cloudinary_cloud_name') {
    console.error('❌ Error: Cloud Name is required.');
    console.error('Usage: node scripts/cleanCloudinary.js <your_cloud_name>');
    console.error('Or set CLOUDINARY_CLOUD_NAME in server/.env');
    process.exit(1);
  }

  // If passed via CLI argument, optionally update server/.env
  if (process.argv[2] && process.argv[2] !== process.env.CLOUDINARY_CLOUD_NAME) {
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
      /CLOUDINARY_CLOUD_NAME=.*/,
      `CLOUDINARY_CLOUD_NAME=${process.argv[2]}`
    );
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`✅ Updated server/.env with CLOUDINARY_CLOUD_NAME=${process.argv[2]}`);
  }

  cloudinary.config({
    cloud_name: targetCloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  console.log(`🔍 Connecting to Cloudinary account: "${targetCloudName}"...`);

  // Verify credentials first
  try {
    const ping = await cloudinary.api.ping();
    console.log('✅ Cloudinary ping successful:', ping);
  } catch (err) {
    console.error('❌ Authentication failed:', err.message || err);
    process.exit(1);
  }

  const resourceTypes = ['image', 'raw', 'video'];
  let totalDeleted = 0;

  for (const type of resourceTypes) {
    try {
      console.log(`\nScanning resources of type "${type}"...`);
      let nextCursor = null;
      let resourceCount = 0;

      do {
        const result = await cloudinary.api.resources({
          resource_type: type,
          type: 'upload',
          max_results: 100,
          next_cursor: nextCursor
        });

        const publicIds = (result.resources || []).map(r => r.public_id);
        if (publicIds.length > 0) {
          console.log(`Found ${publicIds.length} ${type} items:`, publicIds);
          const delRes = await cloudinary.api.delete_resources(publicIds, {
            resource_type: type
          });
          console.log(`Deleted ${type} resources:`, delRes.deleted);
          totalDeleted += publicIds.length;
          resourceCount += publicIds.length;
        }

        nextCursor = result.next_cursor;
      } while (nextCursor);

      if (resourceCount === 0) {
        console.log(`No ${type} resources found.`);
      }
    } catch (err) {
      console.error(`Error deleting ${type} resources:`, err.message || err);
    }
  }

  // Attempt to delete empty filer_ai folder if present
  try {
    console.log('\nChecking for "filer_ai" folder...');
    await cloudinary.api.delete_folder('filer_ai');
    console.log('✅ Deleted "filer_ai" folder.');
  } catch (err) {
    if (!err.message?.includes('not found')) {
      console.log('Folder note:', err.message || err);
    }
  }

  console.log(`\n🎉 Cleanup complete! Total resources deleted: ${totalDeleted}`);
}

cleanCloudinary().catch(err => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
