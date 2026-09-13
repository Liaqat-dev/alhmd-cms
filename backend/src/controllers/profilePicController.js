const sharp = require('sharp');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const uploadProfilePic = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(400, { message: 'No image file provided' });

  const id = req.user.id;
  const isStudent = req.user.role === 'STUDENT';
  const model = isStudent ? prisma.student : prisma.user;

  // Convert to square WebP (sharp handles non-square by cropping centre)
  const webpBuffer = await sharp(req.file.buffer)
    .rotate()                    // auto-orient from EXIF
    .resize(400, 400, {
      fit: 'cover',
      position: 'centre',
    })
    .webp({ quality: 85 })
    .toBuffer();

  // Fetch current pic public_id so we can delete it after successful upload
  const existing = await model.findUnique({
    where: { id },
    select: { profilePicPublicId: true },
  });

  const publicId = `${isStudent ? 'student' : 'user'}_${id}_${Date.now()}`;
  const { url, publicId: savedPublicId } = await uploadToCloudinary(webpBuffer, publicId);

  // Delete old pic from Cloudinary (after new one is safely stored)
  if (existing?.profilePicPublicId) {
    await deleteFromCloudinary(existing.profilePicPublicId);
  }

  const updated = await model.update({
    where: { id },
    data: { profilePicUrl: url, profilePicPublicId: savedPublicId },
    select: isStudent
      ? { id: true, email: true, name: true, rollNumber: true, profilePicUrl: true, profilePicPublicId: true }
      : {
          id: true, email: true, role: true, isVerified: true,
          profilePicUrl: true, profilePicPublicId: true,
          teacher: true, admin: true,
        },
  });

  const responseUser = isStudent
    ? { id, role: 'STUDENT', email: updated.email, profilePicUrl: updated.profilePicUrl, profilePicPublicId: updated.profilePicPublicId, student: updated }
    : updated;

  res.json({ message: 'Profile picture updated', user: responseUser });
});

const deleteProfilePic = catchAsync(async (req, res) => {
  const id = req.user.id;
  const isStudent = req.user.role === 'STUDENT';
  const model = isStudent ? prisma.student : prisma.user;

  const existing = await model.findUnique({
    where: { id },
    select: { profilePicPublicId: true },
  });

  if (!existing?.profilePicPublicId) {
    throw new AppError(400, { message: 'No profile picture to delete' });
  }

  await deleteFromCloudinary(existing.profilePicPublicId);

  const updated = await model.update({
    where: { id },
    data: { profilePicUrl: null, profilePicPublicId: null },
    select: isStudent
      ? { id: true, email: true, name: true, rollNumber: true, profilePicUrl: true, profilePicPublicId: true }
      : {
          id: true, email: true, role: true, isVerified: true,
          profilePicUrl: true, profilePicPublicId: true,
          teacher: true, admin: true,
        },
  });

  const responseUser = isStudent
    ? { id, role: 'STUDENT', email: updated.email, profilePicUrl: updated.profilePicUrl, profilePicPublicId: updated.profilePicPublicId, student: updated }
    : updated;

  res.json({ message: 'Profile picture removed', user: responseUser });
});

module.exports = { uploadProfilePic, deleteProfilePic };
