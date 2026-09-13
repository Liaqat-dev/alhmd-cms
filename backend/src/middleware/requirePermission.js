const prisma = require('../lib/prisma');
const catchAsync = require('../utils/catchAsync');

// requirePermission(...permissionNames) — passes if the user holds ANY of the
// given permissions through one of their assigned Roles.
//
// - ADMIN is always a superuser and bypasses this check entirely. Roles/
//   permissions still apply to admins for bookkeeping, but access is never
//   blocked for them — otherwise a freshly-created admin with no roles
//   assigned yet could lock themselves out of the very screen that assigns
//   roles.
// - STUDENT accounts aren't part of the RBAC system at all (they're not
//   User rows) — routes they can reach are already scoped by roleCheck
//   and per-resource ownership checks in the controller, so this middleware
//   is a no-op for them.
// - TEACHER (and any future non-admin account role) must hold the
//   permission via at least one assigned Role.
const requirePermission = (...permissionNames) => catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'ADMIN' || req.user.role === 'STUDENT') {
    return next();
  }

  const match = await prisma.user.findFirst({
    where: {
      id: req.user.id,
      roles: { some: { permissions: { some: { name: { in: permissionNames } } } } },
    },
    select: { id: true },
  });

  if (!match) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  return next();
});

module.exports = requirePermission;
