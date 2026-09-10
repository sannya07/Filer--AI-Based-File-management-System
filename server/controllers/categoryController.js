const Category = require('../models/Category');
const File = require('../models/File');
const { buildCategoryTree, seedUserDefaultCategories } = require('../services/treeService');

/**
 * @desc    Get user's full category tree with live file counts
 * @route   GET /api/categories
 * @access  Private
 */
const getCategories = async (req, res, next) => {
  try {
    // 1. Seed defaults if this is user's first time
    await seedUserDefaultCategories(req.user._id);

    // 2. Fetch all categories for user
    const categories = await Category.find({ ownerId: req.user._id }).sort({ name: 1 });

    // 3. Compute file counts per category and subcategory
    const catCounts = await File.aggregate([
      { $match: { ownerId: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const subCounts = await File.aggregate([
      { $match: { ownerId: req.user._id, subcategory: { $ne: '' } } },
      { $group: { _id: '$subcategory', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    catCounts.forEach((c) => {
      if (c._id) countMap[c._id] = c.count;
    });
    subCounts.forEach((s) => {
      if (s._id) countMap[s._id] = s.count;
    });

    // 4. Construct n-ary Tree
    const tree = buildCategoryTree(categories, countMap);

    res.status(200).json({
      success: true,
      tree,
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new category or subcategory
 * @route   POST /api/categories
 * @access  Private
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, parentId } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.'
      });
    }

    let parentCategory = null;
    if (parentId) {
      parentCategory = await Category.findOne({
        _id: parentId,
        ownerId: req.user._id
      });
      if (!parentCategory) {
        return res.status(404).json({
          success: false,
          message: 'Parent category not found.'
        });
      }
    }

    // Check for duplicate sibling name
    const existing = await Category.findOne({
      ownerId: req.user._id,
      parentId: parentId || null,
      name: name.trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A category named "${name.trim()}" already exists at this level.`
      });
    }

    const category = await Category.create({
      ownerId: req.user._id,
      name: name.trim(),
      parentId: parentId || null,
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update/Rename a category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
const updateCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const categoryId = req.params.id;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New category name is required.'
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      ownerId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    const oldName = category.name;
    category.name = name.trim();
    await category.save();

    // Cascade rename to files in this category
    if (category.parentId === null) {
      await File.updateMany(
        { ownerId: req.user._id, category: oldName },
        { category: category.name }
      );
    } else {
      await File.updateMany(
        { ownerId: req.user._id, subcategory: oldName },
        { subcategory: category.name }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category (cascades child files to Others)
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
const deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    const category = await Category.findOne({
      _id: categoryId,
      ownerId: req.user._id
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.'
      });
    }

    // Find all child subcategories
    const childCategories = await Category.find({
      ownerId: req.user._id,
      parentId: category._id
    });
    const childNames = childCategories.map((c) => c.name);

    // Relocate files in category/subcategories to 'Others' so files are never orphaned
    if (category.parentId === null) {
      await File.updateMany(
        { ownerId: req.user._id, category: category.name },
        { category: 'Others', subcategory: '' }
      );
      if (childNames.length > 0) {
        await File.updateMany(
          { ownerId: req.user._id, subcategory: { $in: childNames } },
          { category: 'Others', subcategory: '' }
        );
      }
    } else {
      await File.updateMany(
        { ownerId: req.user._id, subcategory: category.name },
        { subcategory: '' }
      );
    }

    // Delete subcategories and category
    await Category.deleteMany({ ownerId: req.user._id, parentId: category._id });
    await Category.findByIdAndDelete(category._id);

    res.status(200).json({
      success: true,
      message: 'Category deleted and associated files relocated to Others.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Move a file to a different category and subcategory
 * @route   PATCH /api/categories/move-file
 * @access  Private
 */
const moveFile = async (req, res, next) => {
  try {
    const { fileId, category, subcategory } = req.body;

    if (!fileId || !category) {
      return res.status(400).json({
        success: false,
        message: 'File ID and target Category are required.'
      });
    }

    const file = await File.findOne({
      _id: fileId,
      ownerId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.category = category;
    file.subcategory = subcategory || '';
    await file.save();

    res.status(200).json({
      success: true,
      message: `File moved to ${category}${subcategory ? ' / ' + subcategory : ''}`,
      file
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  moveFile
};
