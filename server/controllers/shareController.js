const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const ShareLink = require('../models/ShareLink');
const FileModel = require('../models/File');

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

/**
 * @desc    Generate a new secure shareable link for a file
 * @route   POST /api/share/create
 * @access  Private
 */
const createShareLink = async (req, res, next) => {
  try {
    const { fileId, expiryDays, viewOnly = true } = req.body;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        message: 'File ID is required.'
      });
    }

    // Verify user owns the file
    const file = await FileModel.findOne({
      _id: fileId,
      ownerId: req.user._id
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found or unauthorized.'
      });
    }

    // Calculate expiration timestamp if provided
    let expiresAt = null;
    if (expiryDays && Number(expiryDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiryDays) * 24 * 60 * 60 * 1000);
    }

    // Generate cryptographically random URL-safe token
    const token = crypto.randomBytes(12).toString('hex');

    const shareLink = await ShareLink.create({
      fileId: file._id,
      ownerId: req.user._id,
      token,
      viewOnly: Boolean(viewOnly),
      expiresAt,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Share link generated successfully.',
      shareLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get public shared file by token (Unauthenticated public route)
 * @route   GET /api/share/:token
 * @access  Public
 */
const getSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Share token is required.'
      });
    }

    const shareLink = await ShareLink.findOne({ token });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found.'
      });
    }

    // Check if owner revoked the link
    if (!shareLink.isActive) {
      return res.status(403).json({
        success: false,
        isRevoked: true,
        message: 'This link has been revoked by the owner.'
      });
    }

    // Check expiration: TRD Section 15 "If expired: Link Expired. Access denied."
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({
        success: false,
        isExpired: true,
        message: 'Link Expired'
      });
    }

    // Fetch the associated file
    const file = await FileModel.findById(shareLink.fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File no longer exists.'
      });
    }

    // Increment access count
    shareLink.accessCount += 1;
    await shareLink.save();

    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      shareLink: {
        token: shareLink.token,
        viewOnly: shareLink.viewOnly,
        expiresAt: shareLink.expiresAt,
        accessCount: shareLink.accessCount,
        createdAt: shareLink.createdAt
      },
      file: {
        _id: file._id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        summary: file.summary,
        description: file.description,
        tags: file.tags,
        category: file.category,
        subcategory: file.subcategory,
        confidence: file.confidence,
        reasoning: file.reasoning,
        cloudinaryUrl: file.cloudinaryUrl,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active share links for a file
 * @route   GET /api/share/file/:fileId
 * @access  Private
 */
const getFileShareLinks = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const links = await ShareLink.find({
      fileId,
      ownerId: req.user._id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      links
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Revoke a share link
 * @route   DELETE /api/share/:token
 * @access  Private
 */
const revokeShareLink = async (req, res, next) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({
      token,
      ownerId: req.user._id
    });

    if (!shareLink) {
      return res.status(404).json({
        success: false,
        message: 'Share link not found or unauthorized.'
      });
    }

    shareLink.isActive = false;
    await shareLink.save();

    res.status(200).json({
      success: true,
      message: 'Share link revoked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Directly download a shared document with guaranteed original filename and MIME type
 * @route   GET /api/share/:token/download
 * @access  Public
 */
const downloadSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token });
    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found.' });
    }

    if (!shareLink.isActive) {
      return res.status(403).json({ success: false, isRevoked: true, message: 'This link has been revoked by the owner.' });
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, isExpired: true, message: 'Link Expired' });
    }

    if (shareLink.viewOnly) {
      return res.status(403).json({ success: false, message: 'Download is disabled for this view-only share link.' });
    }

    const file = await FileModel.findById(shareLink.fileId);
    if (!file || !file.cloudinaryUrl) {
      return res.status(404).json({ success: false, message: 'File no longer exists.' });
    }

    // Increment access stats
    shareLink.accessCount += 1;
    await shareLink.save();

    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    // Determine correct content type & file extension
    const ext = path.extname(file.fileName || '').toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = file.fileName || 'document';

    // Stream directly from storage
    const response = await axios({
      method: 'GET',
      url: file.cloudinaryUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    response.data.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Directly preview a shared document inline in the browser
 * @route   GET /api/share/:token/preview
 * @access  Public
 */
const previewSharedFile = async (req, res, next) => {
  try {
    const { token } = req.params;

    const shareLink = await ShareLink.findOne({ token });
    if (!shareLink) {
      return res.status(404).json({ success: false, message: 'Share link not found.' });
    }

    if (!shareLink.isActive) {
      return res.status(403).json({ success: false, isRevoked: true, message: 'This link has been revoked by the owner.' });
    }

    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, isExpired: true, message: 'Link Expired' });
    }

    const file = await FileModel.findById(shareLink.fileId);
    if (!file || !file.cloudinaryUrl) {
      return res.status(404).json({ success: false, message: 'File no longer exists.' });
    }

    const ext = path.extname(file.fileName || '').toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = file.fileName || 'document';

    const response = await axios({
      method: 'GET',
      url: file.cloudinaryUrl,
      responseType: 'stream'
    });

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
    );

    response.data.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShareLink,
  getSharedFile,
  getFileShareLinks,
  revokeShareLink,
  downloadSharedFile,
  previewSharedFile
};
