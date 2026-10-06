const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parseId, parseIds } = require('../utils/helpers');
const { SUPER_ADMIN_ROLE } = require('../utils/superAdmin');

// Users = Admin/Teacher accounts only. Students authenticate separately and
// are not part of the RBAC system.

const userSelect = {
  id: true,
  email: true,
  role: true,
  isVerified: true,
  isSuperAdmin: true,
  profilePicUrl: true,
  createdAt: true,
  admin: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
  roles: { select: { id: true, name: true } },
};

// GET /users
const getAllUsers = catchAsync(async (req, res) => {
  const { search, role } = req.query;

  const where = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { admin: { name: { contains: search, mode: 'insensitive' } } },
      { teacher: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ users });
});

// GET /users/:id
const getUserById = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { ...userSelect, roles: { include: { permissions: true } } },
  });

  if (!user) throw new AppError(404, 'User not found');

  res.json({ user });
});

// PUT /users/:id/roles — replaces the full set of roles for this user
const assignRoles = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);
  const { roleIds } = req.body;

  if (!Array.isArray(roleIds)) {
    throw new AppError(400, { message: 'roleIds must be an array' });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'User not found');

  // A super admin's roles are fixed: nobody (least of all themselves) can
  // change them through the API.
  if (existing.isSuperAdmin) {
    throw new AppError(403, existing.id === req.user.id
      ? 'You cannot change your own roles'
      : "A super admin's roles cannot be changed");
  }

  const ids = parseIds(roleIds);
  if (ids.length > 0) {
    const found = await prisma.role.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } });
    if (found.length !== ids.length) {
      throw new AppError(400, { roleIds: 'One or more roles were not found' });
    }
    if (found.some(r => r.name === SUPER_ADMIN_ROLE)) {
      throw new AppError(403, 'The super_admin role cannot be assigned through the API');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { roles: { set: ids.map(rid => ({ id: rid })) } },
    select: userSelect,
  });

  res.json({ message: 'Roles updated successfully', user });
});

module.exports = {
  getAllUsers,
  getUserById,
  assignRoles,
};
