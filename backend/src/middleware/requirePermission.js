const catchAsync = require('../utils/catchAsync');
const { userHasPermission } = require('../utils/permissions');

// requirePermission(...permissionNames) — passes if the user holds ANY of the
// given permissions through one of their assigned Roles (ADMIN always passes,
// STUDENT is out of scope for RBAC — see utils/permissions for details).
const requirePermission = (...permissionNames) => catchAsync(async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const allowed = await userHasPermission(req.user, ...permissionNames);
  if (!allowed) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }

  return next();
});

module.exports = requirePermission;
