const cloudinary = require('cloudinary').v2;

// CLOUDINARY_URL env var is auto-parsed by the SDK
// format: cloudinary://api_key:api_secret@cloud_name
cloudinary.config({ secure: true });

/**
 * Upload a Buffer to Cloudinary.
 * @param {Buffer} buffer  - WebP image buffer
 * @param {string} publicId - Cloudinary public_id (without extension)
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder: 'cga/profile-pics',
        resource_type: 'image',
        overwrite: true,
        format: 'webp',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by its public_id.
 * Silently ignores errors (e.g. already deleted).
 */
async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // non-fatal
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };