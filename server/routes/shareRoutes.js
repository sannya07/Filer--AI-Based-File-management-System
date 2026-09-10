const express = require('express');
const router = express.Router();
const {
  createShareLink,
  getSharedFile,
  getFileShareLinks,
  revokeShareLink
} = require('../controllers/shareController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view shared document (No login required)
router.get('/:token', getSharedFile);

// Protected routes (Owner operations)
router.post('/create', protect, createShareLink);
router.get('/file/:fileId', protect, getFileShareLinks);
router.delete('/:token', protect, revokeShareLink);

module.exports = router;
