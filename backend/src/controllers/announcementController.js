const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getAllAnnouncements = catchAsync(async (req, res) => {
  const { audience, priority, active } = req.query;
  const userRole = req.user.role;
  const where = {};

  if (userRole === 'STUDENT') {
    where.audience = { in: ['STUDENTS', 'BOTH'] };
    where.isActive = true;
  } else if (userRole === 'TEACHER') {
    where.audience = { in: ['TEACHERS', 'BOTH'] };
    where.isActive = true;
  } else if (userRole === 'ADMIN') {
    if (audience) where.audience = audience;
  }

  if (priority) where.priority = priority;
  if (active !== undefined) where.isActive = active === 'true';

  if (userRole !== 'ADMIN') {
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
  }

  const announcements = await prisma.announcement.findMany({
    where,
    orderBy: [{ priority: 'asc' }, { publishedAt: 'desc' }]
  });

  res.json({ announcements });
});

const getAnnouncementById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) throw new AppError(404, 'Announcement not found');
  res.json({ announcement });
});

const createAnnouncement = catchAsync(async (req, res) => {
  const { title, content, audience, priority, publishedAt, expiresAt } = req.body;
  const createdBy = req.user.admin?.name || req.user.email || 'Admin';

  if (!title || !content || !audience) {
    throw new AppError(400, { message: 'Title, content, and audience are required' });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title, content, audience,
      priority: priority || 'NORMAL',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy
    }
  });

  res.status(201).json({ message: 'Announcement created successfully', announcement });
});

const updateAnnouncement = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, content, audience, priority, publishedAt, expiresAt, isActive } = req.body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Announcement not found');

  const announcement = await prisma.announcement.update({
    where: { id },
    data: {
      title, content, audience, priority,
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive
    }
  });

  res.json({ message: 'Announcement updated successfully', announcement });
});

const deleteAnnouncement = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Announcement not found');
  await prisma.announcement.delete({ where: { id } });
  res.json({ message: 'Announcement deleted successfully' });
});

const toggleAnnouncementStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Announcement not found');

  const announcement = await prisma.announcement.update({
    where: { id },
    data: { isActive: !existing.isActive }
  });

  res.json({
    message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully`,
    announcement
  });
});

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus
};
