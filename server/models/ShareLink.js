const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: [true, 'Share link must refer to a file'],
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Share link must belong to a user'],
      index: true
    },
    token: {
      type: String,
      required: [true, 'Share token is required'],
      unique: true,
      index: true
    },
    viewOnly: {
      type: Boolean,
      default: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    accessCount: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// Compound index for fast queries by owner and file
shareLinkSchema.index({ ownerId: 1, fileId: 1 });

module.exports = mongoose.model('ShareLink', shareLinkSchema);
