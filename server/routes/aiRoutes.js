const express = require('express');
const router = express.Router();
const { analyzeDocument } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protected by JWT authentication
router.use(protect);

router.post('/analyze', upload.single('file'), analyzeDocument);

module.exports = router;
