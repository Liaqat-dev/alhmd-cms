const prisma = require('../lib/prisma');

// True if `user` (req.user shape: { id, role, ... }) holds ANY of the given
// permissions through one of their assigned Roles.
//
// There is deliberately no ADMIN special case here: every admin account is
// seeded with (and must always be assigned) the "Administrator" Role, which
// holds every permission in the catalog — so an admin passes this the same
// way anyone else does, via a real, queryable Role assignment. This keeps
// authorization uniform: "admin" isn't a hardcoded bypass, it's just a Role
// that happens to grant everything (see registerAdmin / prisma/seed.js).
//
// STUDENT is the one real special case, and it fails closed, not open:
// Student accounts are never User rows and can never hold a Role, so the
// query below must not run for them — `user.id` for a STUDENT is a
// Student.id, not a User.id, and querying the User table with it risks
// matching an unrelated user whose id happens to coincide.
async function userHasPermission(user, ...permissionNames) {
  if (!user) return false;
  if (user.role === 'STUDENT') return false;

  const match = await prisma.user.findFirst({
    where: {
      id: user.id,
      roles: { some: { permissions: { some: { name: { in: permissionNames } } } } },
    },
    select: { id: true },
  });

  return !!match;
}

// The full, deduped list of permission names a user holds through their
// assigned Roles — for the frontend to conditionally render UI (hide/show
// nav links, "create" buttons, etc.). This is a UX convenience only: the
// backend never trusts it back, every route still re-checks via
// requirePermission/userHasPermission on each request against the live DB
// state, so a stale or tampered client-side value can't grant real access.
//
// No ADMIN special case, for the same reason as userHasPermission — an
// admin's Administrator Role already contains every permission name, so this
// returns the real (large) list rather than an empty one requiring the
// frontend to special-case the role. STUDENT still gets [] : they hold no
// Role by construction.
async function getUserPermissionNames(user) {
  if (!user || user.role === 'STUDENT') return [];

  const roles = await prisma.role.findMany({
    where: { users: { some: { id: user.id } } },
    select: { permissions: { select: { name: true } } },
  });

  const names = new Set();
  for (const role of roles) {
    for (const permission of role.permissions) names.add(permission.name);
  }
  return [...names];
}

module.exports = { userHasPermission, getUserPermissionNames };
