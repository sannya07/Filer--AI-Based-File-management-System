const multer = require('multer');
const path = require('path');

// Memory storage keeps file buffer in memory without writing to temporary disk
const storage = multer.memoryStorage();

// Allowed extensions based on TRD Section 7
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.docx',
  '.txt',
  '.ppt',
  '.pptx',
  '.csv',
  '.zip',
  '.png',
  '.jpg',
  '.jpeg'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${ext}. Allowed types: PDF, DOCX, TXT, PPT, PPTX, CSV, ZIP, PNG, JPG, JPEG`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter
});

module.exports = upload;
