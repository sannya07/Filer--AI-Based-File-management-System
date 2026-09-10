const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'File must have an owner'],
      index: true
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      index: true
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      trim: true
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    hash: {
      type: String,
      required: [true, 'SHA-256 hash is required for duplicate detection'],
      index: true
    },
    summary: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: [],
      index: true
    },
    category: {
      type: String,
      default: 'Others',
      index: true
    },
    subcategory: {
      type: String,
      default: '',
      index: true
    },
    confidence: {
      type: String,
      default: ''
    },
    reasoning: {
      type: String,
      default: ''
    },
    cloudinaryUrl: {
      type: String,
      required: [true, 'Cloudinary URL is required']
    },
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required']
    },
    accessCount: {
      type: Number,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound index for fast duplicate checks per user
fileSchema.index({ ownerId: 1, hash: 1 });

module.exports = mongoose.model('File', fileSchema);
