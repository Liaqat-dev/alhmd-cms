const prisma = require('../lib/prisma');

// True if `user` (req.user shape: { id, role, ... }) holds ANY of the given
// permissions through one of their assigned Roles.
//
// ADMIN is always a superuser (bypasses the check). STUDENT accounts aren't
// part of the RBAC system — routes/controllers gate them separately via
// roleCheck + ownership checks, so this always returns true for them too
// (callers should not rely on this to restrict students; use roleCheck).
async function userHasPermission(user, ...permissionNames) {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'STUDENT') return true;

  const match = await prisma.user.findFirst({
    where: {
      id: user.id,
      roles: { some: { permissions: { some: { name: { in: permissionNames } } } } },
    },
    select: { id: true },
  });

  return !!match;
}

module.exports = { userHasPermission };
