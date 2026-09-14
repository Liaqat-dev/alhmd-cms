const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');

router.use(auth);

// Roles tab manages roles and their permission assignments. This is the
// RBAC system's own control plane — whoever holds roles.edit can grant a
// Role any permission, including users.manage/roles.* themselves, so these
// permissions are effectively admin-equivalent. There's no hardcoded ADMIN
// check anywhere in this app anymore; the safety boundary here is simply
// "don't grant roles.edit/users.manage to a Role you don't fully trust."
router.get('/permissions/all', requirePermission('roles.view'), rolesController.getAllPermissions);

router.get('/', requirePermission('roles.view'), rolesController.getAllRoles);
router.post('/', requirePermission('roles.create'), rolesController.createRole);
router.get('/:id', requirePermission('roles.view'), rolesController.getRoleById);
router.put('/:id', requirePermission('roles.edit'), rolesController.updateRole);
router.delete('/:id', requirePermission('roles.delete'), rolesController.deleteRole);

module.exports = router;
