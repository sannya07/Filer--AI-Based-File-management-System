const express = require('express');
const router = express.Router();
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  moveFile
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');

// All category routes are protected
router.use(protect);

router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.patch('/move-file', moveFile);

module.exports = router;
