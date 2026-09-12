/**
 * Utility to reliably download files in the browser.
 * Fixes cross-origin issue where modern browsers ignore HTML5 `download` attribute
 * and navigate/open the file in a new tab instead of saving it to disk.
 */

/**
 * Returns a Cloudinary URL with the fl_attachment transformation flag,
 * which instructs Cloudinary CDN to emit `Content-Disposition: attachment`.
 * @param {string} url
 * @returns {string}
 */
export const getCloudinaryDownloadUrl = (url) => {
  if (!url || typeof url !== 'string') return url || '';
  if (url.includes('/upload/') && !url.includes('fl_attachment')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
};

/**
 * Downloads a file directly to the user's filesystem.
 * 1. Attempts to fetch the file as a Blob via CORS.
 * 2. Creates a local same-origin object URL so the browser strictly obeys `download={fileName}`.
 * 3. Falls back seamlessly to the Cloudinary fl_attachment URL if fetch fails.
 *
 * @param {string} url - Cloudinary or file URL
 * @param {string} fileName - Target file name with extension
 */
export const triggerDownload = async (url, fileName = 'download') => {
  if (!url) return;

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      throw new Error(`Download fetch failed with status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke object URL after slight delay to free memory
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.warn('Direct blob download fallback to attachment URL:', err);
    const fallbackUrl = getCloudinaryDownloadUrl(url);
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
