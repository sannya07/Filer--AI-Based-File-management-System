const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

// Configure Cloudinary
const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  return (
    cloudName &&
    apiKey &&
    apiSecret &&
    apiKey !== 'your_cloudinary_api_key' &&
    cloudName !== 'your_cloudinary_cloud_name'
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  });
}

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Upload options (fileName, folder, resourceType)
 * @returns {Promise<{ publicId: string, secureUrl: string, resourceType: string }>}
 */
const uploadBuffer = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Graceful fallback for development if Cloudinary credentials are not yet added
    if (!isCloudinaryConfigured()) {
      console.warn('⚠️ Cloudinary not configured. Using local simulated storage response.');
      const mockId = `filer_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      return resolve({
        publicId: mockId,
        secureUrl: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
        resourceType: 'raw'
      });
    }

    const uploadOptions = {
      folder: options.folder || 'filer_ai',
      resource_type: options.resourceType || 'auto',
      use_filename: true,
      unique_filename: true,
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Stream Error:', error);
          return reject(error);
        }
        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Delete a resource from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - Resource type ('image', 'raw', 'video')
 */
const deleteResource = async (publicId, resourceType = 'raw') => {
  if (!isCloudinaryConfigured() || publicId.startsWith('filer_mock_')) {
    return { result: 'ok (simulated)' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};

module.exports = {
  uploadBuffer,
  deleteResource,
  isCloudinaryConfigured
};
