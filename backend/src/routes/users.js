const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Admin-only: Users tab manages Teacher/Admin accounts and their roles.
router.use(auth, roleCheck('ADMIN'));

router.get('/', usersController.getAllUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id/roles', usersController.assignRoles);

module.exports = router;
