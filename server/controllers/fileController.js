const File = require('../models/File');
const { generateHash } = require('../services/hashService');
const { uploadBuffer, deleteResource } = require('../services/cloudinaryService');
const path = require('path');

/**
 * @desc    Check if a file with the given SHA-256 hash already exists for the user
 * @route   POST /api/files/check-duplicate
 * @access  Private
 */
const checkDuplicate = async (req, res, next) => {
  try {
    const { hash } = req.body;

    if (!hash) {
      return res.status(400).json({
        success: false,
        message: 'SHA-256 hash is required.'
      });
    }

    const existingFile = await File.findOne({
      ownerId: req.user._id,
      hash
    });

    if (existingFile) {
      return res.status(200).json({
        success: true,
        isDuplicate: true,
        message: 'Possible duplicate detected.',
        existingFile: {
          _id: existingFile._id,
          fileName: existingFile.fileName,
          uploadedAt: existingFile.uploadedAt,
          category: existingFile.category
        }
      });
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false,
      message: 'No duplicate found.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload file to Cloudinary and store metadata in MongoDB
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a file to upload.'
      });
    }

    const { originalname, buffer, size, mimetype } = req.file;
    const { category, subcategory, tags } = req.body;

    // 1. Calculate SHA-256 hash for integrity and duplicate tracking
    const hash = generateHash(buffer);

    // 2. Upload file buffer to Cloudinary
    const ext = path.extname(originalname).toLowerCase();
    const resourceType = ['.png', '.jpg', '.jpeg'].includes(ext) ? 'image' : 'raw';

    const cloudinaryResult = await uploadBuffer(buffer, {
      folder: `filer_ai/user_${req.user._id}`,
      resourceType
    });

    // Parse tags if sent as JSON string or comma-separated
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        try {
          parsedTags = JSON.parse(tags);
        } catch {
          parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }
    }

    // 3. Save metadata in MongoDB Atlas
    const newFile = await File.create({
      ownerId: req.user._id,
      fileName: originalname,
      fileType: mimetype || ext.replace('.', ''),
      fileSize: size,
      hash,
      category: category || 'Others',
      subcategory: subcategory || '',
      tags: parsedTags,
      cloudinaryUrl: cloudinaryResult.secureUrl,
      publicId: cloudinaryResult.publicId
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: newFile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all files for the authenticated user
 * @route   GET /api/files
 * @access  Private
 */
const getFiles = async (req, res, next) => {
  try {
    const { category, search, sort = 'uploadedAt' } = req.query;

    const query = { ownerId: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.fileName = { $regex: search, $options: 'i' };
    }

    // Fetch files sorted by newest first
    const files = await File.find(query).sort({ [sort]: -1 });

    // Calculate user storage totals
    const totalFiles = await File.countDocuments({ ownerId: req.user._id });
    const storageAggregation = await File.aggregate([
      { $match: { ownerId: req.user._id } },
      { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } }
    ]);
    const totalStorageBytes =
      storageAggregation.length > 0 ? storageAggregation[0].totalBytes : 0;

    res.status(200).json({
      success: true,
      count: files.length,
      totalFiles,
      totalStorageBytes,
      files
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single file by ID (tracks accessCount and recency)
 * @route   GET /api/files/:id
 * @access  Private
 */
const getFileById = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    // Update access statistics
    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete file from Cloudinary and MongoDB
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    // 1. Delete from Cloudinary
    const ext = path.extname(file.fileName).toLowerCase();
    const resourceType = ['.png', '.jpg', '.jpeg'].includes(ext) ? 'image' : 'raw';
    await deleteResource(file.publicId, resourceType);

    // 2. Delete from MongoDB
    await File.findByIdAndDelete(file._id);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkDuplicate,
  uploadFile,
  getFiles,
  getFileById,
  deleteFile
};
