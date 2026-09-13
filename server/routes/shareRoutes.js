const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getSharedFile,
  getFileShareLinks,
  revokeShareLink,
  downloadSharedFile,
  previewSharedFile
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Public routes for viewing and downloading shared documents
router.get('/:token', getSharedFile);
router.get('/:token/download', downloadSharedFile);
router.get('/:token/preview', previewSharedFile);

// Protected routes (Owner operations)
router.post('/create', protect, createShareLink);
router.get('/file/:fileId', protect, getFileShareLinks);
router.delete('/:token', protect, revokeShareLink);

module.exports = router;
