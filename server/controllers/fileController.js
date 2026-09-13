const File = require('../models/File');
const { generateHash } = require('../services/hashService');
const { uploadBuffer, deleteResource } = require('../services/cloudinaryService');
const { saveLocalBuffer, getFileBuffer } = require('../services/fileStorageService');
const { extractTextFromBuffer, convertDocxToHtml } = require('../services/textExtractionService');
const { answerFileQuestion } = require('../services/qaService');
const { getTopImportantFiles } = require('../services/priorityQueueService');
const path = require('path');
const axios = require('axios');

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
    const { category, subcategory, tags, summary, description, confidence, reasoning } = req.body;

    // 1. Calculate SHA-256 hash for integrity and duplicate tracking
    const hash = generateHash(buffer);

    // 2. Upload file buffer to Cloudinary
    const ext = path.extname(originalname).toLowerCase();
    const resourceType = ['.png', '.jpg', '.jpeg'].includes(ext) ? 'image' : 'raw';
    const cleanBaseName = path.parse(originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'file';
    const uniquePublicId = `${cleanBaseName}_${Date.now().toString(36)}${ext}`;

    const cloudinaryResult = await uploadBuffer(buffer, {
      folder: `filer_ai/user_${req.user._id}`,
      public_id: uniquePublicId,
      fileName: originalname,
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
      summary: summary || '',
      description: description || '',
      tags: parsedTags,
      category: category || 'Others',
      subcategory: subcategory || '',
      confidence: confidence || '',
      reasoning: reasoning || '',
      cloudinaryUrl: cloudinaryResult.secureUrl,
      publicId: cloudinaryResult.publicId
    });

    // 4. Cache buffer locally for instant lazy processing (Q&A)
    saveLocalBuffer(newFile._id, hash, buffer);

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
    const { category, subcategory, search, sort = 'uploadedAt' } = req.query;

    const query = { ownerId: req.user._id };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (subcategory && subcategory !== 'All') {
      query.subcategory = subcategory;
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

/**
 * @desc    Ask a question about a specific file (Lazy RAG with strict grounding)
 * @route   POST /api/files/:id/ask
 * @access  Private
 */
const askFile = async (req, res, next) => {
  try {
    const { question, history } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required.'
      });
    }

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

    // 1. Fetch file buffer (Lazy retrieval from local cache or Cloudinary)
    const buffer = await getFileBuffer(file);

    // 2. Perform lazy chunking, ranking, and grounded question answering
    const { answer, sources } = await answerFileQuestion(
      file,
      buffer,
      question.trim(),
      history || []
    );

    // 3. Track access
    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      fileId: file._id,
      fileName: file.fileName,
      question: question.trim(),
      answer,
      sources
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top important & trending files ranked by Priority Queue (Max-Heap DSA)
 * @route   GET /api/files/important
 * @access  Private
 */
const getImportantFiles = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 6;
    const files = await File.find({ ownerId: req.user._id });

    const topImportant = getTopImportantFiles(files, limit);

    res.status(200).json({
      success: true,
      count: topImportant.length,
      files: topImportant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle pin status on a file (gives +500 priority boost in Max-Heap)
 * @route   PATCH /api/files/:id/pin
 * @access  Private
 */
const togglePinFile = async (req, res, next) => {
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

    file.isPinned = !file.isPinned;
    file.lastAccessed = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      message: file.isPinned ? 'File pinned to top' : 'File unpinned',
      isPinned: file.isPinned,
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record file access (increments accessCount & updates recency)
 * @route   POST /api/files/:id/access
 * @access  Private
 */
const recordFileAccess = async (req, res, next) => {
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

    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    res.status(200).json({
      success: true,
      accessCount: file.accessCount,
      lastAccessed: file.lastAccessed,
      file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Rename a file (PRD FR-13)
 * @route   PATCH /api/files/:id/rename
 * @access  Private
 */
const renameFile = async (req, res, next) => {
  try {
    const { newName } = req.body;

    if (!newName || !newName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New file name is required.'
      });
    }

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

    // Preserve original extension if user omitted it
    let updatedName = newName.trim();
    const originalExt = path.extname(file.fileName);
    if (originalExt && !path.extname(updatedName)) {
      updatedName = `${updatedName}${originalExt}`;
    }

    file.fileName = updatedName;
    file.lastAccessed = new Date();
    await file.save();

    // Invalidate Trie cache for this user so search picks up the new name instantly
    try {
      const { invalidateUserTrie } = require('./searchController');
      invalidateUserTrie(req.user._id);
    } catch {
      // Non-critical
    }

    res.status(200).json({
      success: true,
      message: 'File renamed successfully',
      file
    });
  } catch (error) {
    next(error);
  }
};

const createFallbackBuffer = (fileName, file) => {
  const ext = path.extname(fileName || '').toLowerCase();
  const title = (file.fileName || fileName || 'Document').replace(/[()]/g, '');
  const summary = (file.summary || file.description || 'Document uploaded in development mode.').replace(/[()]/g, '').substring(0, 100);

  if (ext === '.pdf') {
    const content = `BT /F1 18 Tf 50 720 Td (${title}) Tj /F1 12 Tf 0 -30 Td (${summary}) Tj ET`;
    const streamLength = Buffer.byteLength(content);
    return {
      contentType: 'application/pdf',
      buffer: Buffer.from(
        `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >> endobj\n4 0 obj << /Length ${streamLength} >>\nstream\n${content}\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000282 00000 n \ntrailer << /Size 5 /Root 1 0 R >>\nstartxref\n400\n%%EOF\n`
      )
    };
  }

  const textContent = `=== FILER AI: ${file.fileName} ===\n\nSummary: ${file.summary || file.description || 'Uploaded in development mode.'}\nCategory: ${file.category || 'General'}\nUploaded: ${file.uploadedAt || new Date().toISOString()}`;
  return {
    contentType: ext === '.txt' ? 'text/plain; charset=utf-8' : (MIME_TYPES[ext] || 'application/octet-stream'),
    buffer: Buffer.from(textContent, 'utf-8')
  };
};

/**
 * @desc    Directly download a user file with guaranteed original filename and MIME type
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!file || !file.cloudinaryUrl) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    file.accessCount += 1;
    file.lastAccessed = new Date();
    await file.save();

    const ext = path.extname(file.fileName || '').toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = file.fileName || 'document';

    const isMockFile =
      Boolean(file.publicId && file.publicId.startsWith('filer_mock_')) ||
      Boolean(file.cloudinaryUrl && file.cloudinaryUrl.includes('/demo/image/upload/sample.jpg'));

    if (isMockFile && ext !== '.jpg' && ext !== '.jpeg') {
      const fallback = createFallbackBuffer(fileName, file);
      res.setHeader('Content-Type', fallback.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
      );
      res.setHeader('Content-Length', fallback.buffer.length);
      return res.end(fallback.buffer);
    }

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

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * @desc    Directly preview a user file inline in the browser
 * @route   GET /api/files/:id/preview
 * @access  Private
 */
const previewFile = async (req, res, next) => {
  try {
    const file = await File.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!file || !file.cloudinaryUrl) {
      return res.status(404).json({
        success: false,
        message: 'File not found.'
      });
    }

    const ext = path.extname(file.fileName || '').toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileName = file.fileName || 'document';

    const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext);
    const isPdf = ext === '.pdf';
    const isDocx = ext === '.docx' || ext === '.doc';

    // If browser-native format (image or PDF), stream inline
    if (isImage || isPdf) {
      const isMockFile =
        Boolean(file.publicId && file.publicId.startsWith('filer_mock_')) ||
        Boolean(file.cloudinaryUrl && file.cloudinaryUrl.includes('/demo/image/upload/sample.jpg'));

      if (isMockFile && ext !== '.jpg' && ext !== '.jpeg') {
        const fallback = createFallbackBuffer(fileName, file);
        res.setHeader('Content-Type', fallback.contentType);
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
        );
        return res.end(fallback.buffer);
      }

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

      return response.data.pipe(res);
    }

    // For non-browser native formats (DOCX, TXT, CSV, etc.), serve clean HTML reader
    let contentHtml = null;
    let contentText = null;

    try {
      const buffer = await getFileBuffer(file);
      if (isDocx) {
        contentHtml = await convertDocxToHtml(buffer);
      }
      contentText = await extractTextFromBuffer(buffer, fileName);
    } catch (extractErr) {
      console.warn('Buffer extraction for preview notice:', extractErr.message);
      contentText = file.summary || file.description || 'Document text extracted during indexing.';
    }

    const title = escapeHtml(file.fileName || 'Document');
    const summary = file.summary ? escapeHtml(file.summary) : '';
    const category = escapeHtml(file.category || 'General');
    const sizeText = file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : '';

    const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - FILER AI Document Viewer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #0f172a;
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --accent-glow: rgba(99, 102, 241, 0.12);
      --reader-bg: #0b1120;
      --reader-border: #1e293b;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card: #ffffff;
        --card-border: #e2e8f0;
        --text: #0f172a;
        --text-muted: #64748b;
        --accent: #4f46e5;
        --accent-glow: rgba(79, 70, 229, 0.08);
        --reader-bg: #ffffff;
        --reader-border: #e2e8f0;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 4rem;
      min-height: 100vh;
    }
    .top-bar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: var(--card);
      border-bottom: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      padding: 0.85rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand { font-weight: 800; font-size: 1.15rem; letter-spacing: -0.02em; }
    .brand span { color: var(--accent); }
    .container { max-width: 860px; margin: 2rem auto; padding: 0 1.25rem; }
    .header-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }
    .doc-title { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; word-break: break-word; }
    .doc-meta { display: flex; gap: 0.85rem; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1rem; }
    .doc-summary { background: var(--accent-glow); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 0.85rem; padding: 1rem 1.25rem; font-size: 0.875rem; }
    .reader-card {
      background: var(--reader-bg);
      border: 1px solid var(--reader-border);
      border-radius: 1.25rem;
      padding: 2.5rem;
      min-height: 420px;
    }
    .prose-content { font-size: 1.025rem; line-height: 1.8; color: var(--text); }
    .prose-content h1, .prose-content h2, .prose-content h3 { margin-top: 1.5rem; margin-bottom: 0.75rem; }
    .prose-content p { margin-bottom: 1rem; }
    .prose-content ul, .prose-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    .pre-content { font-family: 'JetBrains Mono', monospace; font-size: 0.875rem; white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">FILER<span>AI</span> Workspace Reader</div>
  </div>
  <main class="container">
    <div class="header-card">
      <h1 class="doc-title">${title}</h1>
      <div class="doc-meta">
        <span>Format: <strong>${ext ? ext.toUpperCase().replace('.', '') : 'DOC'}</strong></span>
        ${sizeText ? `<span>•</span><span>Size: <strong>${sizeText}</strong></span>` : ''}
        <span>•</span><span>Category: <strong>${category}</strong></span>
      </div>
      ${summary ? `<div class="doc-summary"><strong>AI Summary:</strong> ${summary}</div>` : ''}
    </div>
    <div class="reader-card">
      ${contentHtml ? `<div class="prose-content">${contentHtml}</div>` : `<pre class="pre-content">${escapeHtml(contentText)}</pre>`}
    </div>
  </main>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkDuplicate,
  uploadFile,
  getFiles,
  getFileById,
  deleteFile,
  askFile,
  getImportantFiles,
  togglePinFile,
  recordFileAccess,
  renameFile,
  downloadFile,
  previewFile
};
