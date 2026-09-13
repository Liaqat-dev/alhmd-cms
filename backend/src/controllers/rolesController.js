const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parseId, parseIds } = require('../utils/helpers');

// ── Roles ─────────────────────────────────────────────────────────────────────

const roleInclude = {
  permissions: { orderBy: { name: 'asc' } },
  _count: { select: { users: true } },
};

// GET /roles
const getAllRoles = catchAsync(async (req, res) => {
  const roles = await prisma.role.findMany({
    include: roleInclude,
    orderBy: { name: 'asc' },
  });
  res.json({ roles });
});

// GET /roles/:id
const getRoleById = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);
  const role = await prisma.role.findUnique({ where: { id }, include: roleInclude });
  if (!role) throw new AppError(404, 'Role not found');
  res.json({ role });
});

// POST /roles
const createRole = catchAsync(async (req, res) => {
  const { name, description, permissionIds = [] } = req.body;

  if (!name || !name.trim()) {
    throw new AppError(400, { name: 'Role name is required' });
  }

  const existing = await prisma.role.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } });
  if (existing) throw new AppError(409, { name: 'A role with this name already exists' });

  const ids = parseIds(permissionIds);

  const role = await prisma.role.create({
    data: {
      name: name.trim(),
      description: description || null,
      ...(ids.length > 0 && { permissions: { connect: ids.map(pid => ({ id: pid })) } }),
    },
    include: roleInclude,
  });

  res.status(201).json({ message: 'Role created successfully', role });
});

// PUT /roles/:id
const updateRole = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);
  const { name, description, permissionIds } = req.body;

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Role not found');

  if (name !== undefined) {
    const dup = await prisma.role.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id } },
    });
    if (dup) throw new AppError(409, { name: 'A role with this name already exists' });
  }

  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description || null }),
      ...(Array.isArray(permissionIds) && {
        permissions: { set: parseIds(permissionIds).map(pid => ({ id: pid })) },
      }),
    },
    include: roleInclude,
  });

  res.json({ message: 'Role updated successfully', role });
});

// DELETE /roles/:id
const deleteRole = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Role not found');

  await prisma.role.delete({ where: { id } });

  res.json({ message: 'Role deleted successfully' });
});

// ── Permissions (fixed catalog — seeded, listable, not user-creatable here) ───

// GET /roles/permissions/all
const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json({ permissions });
});

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
};
