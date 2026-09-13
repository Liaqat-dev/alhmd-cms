const express = require('express');
const router = express.Router();
const rolesController = require('../controllers/rolesController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Admin-only: Roles tab manages roles and their permission assignments.
router.use(auth, roleCheck('ADMIN'));

router.get('/permissions/all', rolesController.getAllPermissions);

router.get('/', rolesController.getAllRoles);
router.post('/', rolesController.createRole);
router.get('/:id', rolesController.getRoleById);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);

module.exports = router;
