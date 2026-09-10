const express = require('express');
const router = express.Router();
const {
  getAutocompleteSuggestions,
  searchFiles
} = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

// All search routes are protected
router.use(protect);

router.get('/suggestions', getAutocompleteSuggestions);
router.get('/', searchFiles);

module.exports = router;
