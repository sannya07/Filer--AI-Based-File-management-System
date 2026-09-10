const Category = require('../models/Category');

/**
 * Builds an n-ary tree hierarchy from flat category records in O(N) time
 * @param {Array} categories - Array of category documents from MongoDB
 * @param {Object} fileCountMap - Map of category/subcategory names to file counts
 * @returns {Array} Array of root category tree nodes with nested children
 */
const buildCategoryTree = (categories, fileCountMap = {}) => {
  const nodeMap = new Map();
  const roots = [];

  // Pass 1: Initialize all tree nodes
  categories.forEach((cat) => {
    const id = cat._id.toString();
    nodeMap.set(id, {
      _id: cat._id,
      name: cat.name,
      parentId: cat.parentId ? cat.parentId.toString() : null,
      isDefault: Boolean(cat.isDefault),
      fileCount: fileCountMap[cat.name] || 0,
      children: []
    });
  });

  // Pass 2: Connect child nodes to their parent nodes
  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId);
      parent.children.push(node);
      // Aggregate child counts up to parent
      parent.fileCount += node.fileCount;
    } else {
      roots.push(node);
    }
  });

  return roots;
};

/**
 * Seeds frozen default categories & subcategories per TRD Section 14
 * @param {string|ObjectId} userId - User ID
 */
const seedUserDefaultCategories = async (userId) => {
  const existingCount = await Category.countDocuments({ ownerId: userId });
  if (existingCount > 0) {
    return;
  }

  const defaultStructure = [
    {
      name: 'Study Material',
      subcategories: ['AWS', 'DBMS', 'OS']
    },
    {
      name: 'Projects',
      subcategories: ['MERN', 'Cloud']
    },
    { name: 'Resumes', subcategories: [] },
    { name: 'Certificates', subcategories: [] },
    { name: 'News', subcategories: [] },
    { name: 'Personal', subcategories: [] },
    { name: 'Others', subcategories: [] }
  ];

  for (const item of defaultStructure) {
    // Create root category
    const parentCat = await Category.create({
      ownerId: userId,
      name: item.name,
      parentId: null,
      isDefault: true
    });

    // Create subcategories if any
    for (const subName of item.subcategories) {
      await Category.create({
        ownerId: userId,
        name: subName,
        parentId: parentCat._id,
        isDefault: true
      });
    }
  }
};

module.exports = {
  buildCategoryTree,
  seedUserDefaultCategories
};
