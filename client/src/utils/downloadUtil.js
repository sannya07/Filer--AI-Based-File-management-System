/**
 * Utility to reliably download files in the browser.
 * Fixes cross-origin issues and guarantees proper filename & extension preservation.
 */

/**
 * Downloads a file directly to the user's filesystem.
 * 1. Attempts to fetch the file as a Blob via CORS.
 * 2. Creates a local same-origin object URL so the browser strictly obeys `download={fileName}`.
 * 3. Falls back cleanly to direct link download if blob fetch fails.
 *
 * @param {string} url - API download URL or Cloudinary file URL
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
    }, 2000);
  } catch (err) {
    console.warn('Direct blob download fallback:', err);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
