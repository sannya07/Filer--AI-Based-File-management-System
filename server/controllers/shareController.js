const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const ShareLink = require('../models/ShareLink');
const FileModel = require('../models/File');
const { getFileBuffer } = require('../services/fileStorageService');
const { extractTextFromBuffer, convertDocxToHtml } = require('../services/textExtractionService');

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

    // Check if file was created in development mock mode
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

const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const renderStandaloneDocumentReaderHtml = ({ file, shareLink, contentHtml, contentText, ext }) => {
  const isViewOnly = Boolean(shareLink?.viewOnly);
  const title = escapeHtml(file.fileName || 'Shared Document');
  const summary = file.summary ? escapeHtml(file.summary) : '';
  const category = escapeHtml(file.category || 'Document');
  const subcategory = file.subcategory ? escapeHtml(file.subcategory) : '';
  const sizeText = file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : '';

  let bodyContent = '';
  if (contentHtml) {
    bodyContent = `<div class="prose-content">${contentHtml}</div>`;
  } else if (contentText) {
    bodyContent = `<pre class="pre-content">${escapeHtml(contentText)}</pre>`;
  } else {
    bodyContent = `<div class="empty-notice">Document preview is being prepared. Please check the summary above.</div>`;
  }

  return `<!DOCTYPE html>
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
      --badge-bg: rgba(99, 102, 241, 0.15);
      --badge-text: #a5b4fc;
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
        --badge-bg: #e0e7ff;
        --badge-text: #3730a3;
        --reader-bg: #ffffff;
        --reader-border: #e2e8f0;
      }
    }
    ${isViewOnly ? `
    @media print {
      body { display: none !important; }
    }
    ` : ''}
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
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 800;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }
    .brand span { color: var(--accent); }
    .badges {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      background: var(--badge-bg);
      color: var(--badge-text);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .badge-viewonly {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .container {
      max-width: 860px;
      margin: 2rem auto;
      padding: 0 1.25rem;
    }
    .header-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 1.25rem;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    }
    .doc-title {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
      word-break: break-word;
    }
    .doc-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.85rem;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .doc-summary {
      background: var(--accent-glow);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 0.85rem;
      padding: 1rem 1.25rem;
      font-size: 0.875rem;
      line-height: 1.6;
    }
    .doc-summary strong { color: var(--accent); }
    .reader-card {
      background: var(--reader-bg);
      border: 1px solid var(--reader-border);
      border-radius: 1.25rem;
      padding: 2.5rem;
      box-shadow: 0 15px 35px -5px rgba(0,0,0,0.25);
      min-height: 420px;
    }
    .prose-content {
      font-size: 1.025rem;
      line-height: 1.8;
      color: var(--text);
    }
    .prose-content h1, .prose-content h2, .prose-content h3 {
      font-weight: 700;
      margin-top: 1.75rem;
      margin-bottom: 0.85rem;
      letter-spacing: -0.015em;
    }
    .prose-content p { margin-bottom: 1.15rem; }
    .prose-content ul, .prose-content ol { margin-left: 1.5rem; margin-bottom: 1.15rem; }
    .prose-content li { margin-bottom: 0.35rem; }
    .prose-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    .prose-content th, .prose-content td {
      border: 1px solid var(--reader-border);
      padding: 0.65rem 0.85rem;
      text-align: left;
    }
    .pre-content {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      line-height: 1.75;
      color: var(--text);
    }
    .empty-notice {
      color: var(--text-muted);
      text-align: center;
      padding: 3rem 1rem;
      font-size: 0.9rem;
    }
    .footer-bar {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="brand">FILER<span>AI</span> Document Reader</div>
    <div class="badges">
      <span class="badge">${category}</span>
      ${subcategory ? `<span class="badge">${subcategory}</span>` : ''}
      ${isViewOnly ? '<span class="badge badge-viewonly">🔒 View Only</span>' : '<span class="badge">🌐 Shared</span>'}
    </div>
  </div>

  <main class="container">
    <div class="header-card">
      <h1 class="doc-title">${title}</h1>
      <div class="doc-meta">
        <span>Format: <strong>${ext ? ext.toUpperCase().replace('.', '') : 'DOC'}</strong></span>
        ${sizeText ? `<span>•</span><span>Size: <strong>${sizeText}</strong></span>` : ''}
        <span>•</span><span>Uploaded: <strong>${new Date(file.uploadedAt || Date.now()).toLocaleDateString()}</strong></span>
      </div>
      ${summary ? `
      <div class="doc-summary">
        <strong>AI Summary:</strong> ${summary}
      </div>` : ''}
    </div>

    <div class="reader-card">
      ${bodyContent}
    </div>

    <div class="footer-bar">
      ${isViewOnly ? 'Protected View-Only Document. Direct download and copying restricted.' : 'Protected by FILER AI Secure Document Delivery'}
    </div>
  </main>
  ${isViewOnly ? `
  <script>
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        alert('This document is shared in View-Only mode. Saving and printing are restricted.');
      }
    });
  </script>` : ''}
</body>
</html>`;
};

/**
 * @desc    Get readable document content (HTML, text, or preview type) for shared document viewer
 * @route   GET /api/share/:token/content
 * @access  Public
 */
const getSharedFileContent = async (req, res, next) => {
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
    if (!file) {
      return res.status(404).json({ success: false, message: 'File no longer exists.' });
    }

    const ext = path.extname(file.fileName || '').toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'].includes(ext);
    const isPdf = ext === '.pdf';
    const isDocx = ext === '.docx' || ext === '.doc';
    const isText = ['.txt', '.csv', '.json', '.md', '.log', '.js', '.py', '.html', '.css'].includes(ext);

    let previewType = 'other';
    if (isImage) previewType = 'image';
    else if (isPdf) previewType = 'pdf';
    else if (isDocx) previewType = 'docx';
    else if (isText) previewType = 'text';

    let contentHtml = null;
    let contentText = null;

    try {
      const buffer = await getFileBuffer(file);
      if (isDocx) {
        contentHtml = await convertDocxToHtml(buffer);
        contentText = await extractTextFromBuffer(buffer, file.fileName);
      } else if (isText) {
        contentText = buffer.toString('utf-8');
      } else if (isPdf) {
        contentText = await extractTextFromBuffer(buffer, file.fileName);
      } else {
        contentText = await extractTextFromBuffer(buffer, file.fileName);
      }
    } catch (bufferErr) {
      console.warn('Could not extract content from buffer for preview:', bufferErr.message);
      contentText = file.summary || file.description || '';
    }

    res.status(200).json({
      success: true,
      fileId: file._id,
      fileName: file.fileName,
      fileType: ext,
      fileSize: file.fileSize,
      previewType,
      viewOnly: shareLink.viewOnly,
      contentHtml,
      contentText,
      previewUrl: `/api/share/${token}/preview`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Directly preview a shared document inline in the browser without downloading
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

    // For DOCX, DOC, PPTX, TXT, CSV, JSON, MD or other formats:
    // Browsers CANNOT display raw DOCX/PPTX streams and automatically trigger a download!
    // Instead, serve the standalone HTML web reader so the user can VIEW the document!
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

    const htmlPage = renderStandaloneDocumentReaderHtml({
      file,
      shareLink,
      contentHtml,
      contentText,
      ext
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage);
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
  previewSharedFile,
  getSharedFileContent
};
