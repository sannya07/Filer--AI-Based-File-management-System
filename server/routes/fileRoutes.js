const express = require('express');
const router = express.Router();
const {
  checkDuplicate,
  uploadFile,
  getFiles,
  getFileById,
  deleteFile,
  askFile
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All file routes are protected by JWT authentication
router.use(protect);

router.post('/check-duplicate', checkDuplicate);
router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getFiles);
router.get('/:id', getFileById);
router.post('/:id/ask', askFile);
router.delete('/:id', deleteFile);

module.exports = router;
