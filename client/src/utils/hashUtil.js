/**
 * Computes SHA-256 hash of a file directly in browser memory using Web Crypto API
 * @param {File} file - Browser File object
 * @returns {Promise<string>} Hexadecimal SHA-256 hash
 */
export const computeFileHash = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Formats bytes into human-readable size
 * @param {number} bytes 
 * @returns {string} e.g. "2.4 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
