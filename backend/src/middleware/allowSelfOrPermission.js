const catchAsync = require('../utils/catchAsync');
const { userHasPermission } = require('../utils/permissions');

// allowSelfOrPermission(getOwnResourceId, ...permissionNames)
//
// Passes a route like GET /teachers/:id if EITHER:
//   - the caller's own linked resource id (as resolved by getOwnResourceId)
//     matches the requested :id — i.e. they're looking at their own record, or
//   - they hold any of the given permissions (ADMIN always does, via the
//     Administrator role; STUDENT never does — see utils/permissions).
//
// getOwnResourceId(req.user) returns the id that counts as "their own" for
// this resource (e.g. `u => u.teacher?.id`), or null/undefined if this
// account type has no "own" record for it at all (ownership never matches,
// falls through to the permission check).
//
// This replaces hand-rolling the same "self or permission" branch inside
// each controller — extracted here so it reads the same way at every route
// that needs it instead of being reimplemented per-controller.
const allowSelfOrPermission = (getOwnResourceId, ...permissionNames) =>
  catchAsync(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const requestedId = parseInt(req.params.id, 10);
    const ownId = getOwnResourceId(req.user);

    if (ownId != null && ownId === requestedId) {
      return next();
    }

    const allowed = await userHasPermission(req.user, ...permissionNames);
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    }

    return next();
  });

module.exports = allowSelfOrPermission;
