const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get all classes — for admin forms
router.get('/all', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.view'), classController.getAllClassesNoBatch);

// Get all classes (accessible by admin and teacher)
router.get('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.view'), classController.getAllClasses);
router.get('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.view'), classController.getClassById);

// Admin always allowed; Teacher needs the matching permission via their role.
router.post('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.create'), classController.createClass);
router.put('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.edit'), classController.updateClass);
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('classes.delete'), classController.deleteClass);

// Subject management (legacy — not used by the current UI, kept admin-only)
router.post('/:id/subjects', roleCheck('ADMIN'), classController.addSubject);
router.delete('/subjects/:subjectId', roleCheck('ADMIN'), classController.removeSubject);

module.exports = router;
