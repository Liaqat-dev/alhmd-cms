const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');

router.use(auth);

// Users tab manages Teacher/Admin accounts and their roles. Permission-gated
// like everything else — see roles.js for why users.manage/roles.edit are
// treated as effectively admin-equivalent permissions.
router.get('/', requirePermission('users.view'), usersController.getAllUsers);
router.get('/:id', requirePermission('users.view'), usersController.getUserById);
router.put('/:id/roles', requirePermission('users.manage'), usersController.assignRoles);

module.exports = router;
