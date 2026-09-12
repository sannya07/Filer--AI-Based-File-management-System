const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function cleanDbFiles() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing in server/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);

  const File = mongoose.connection.collection('files');
  const count = await File.countDocuments();
  console.log(`Found ${count} files in the database.`);

  if (count > 0) {
    const result = await File.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} file records from MongoDB.`);
  } else {
    console.log('No files to delete in database.');
  }

  process.exit(0);
}

cleanDbFiles().catch(err => {
  console.error('Error cleaning database files:', err);
  process.exit(1);
});
