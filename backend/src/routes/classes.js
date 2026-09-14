const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get all classes — for admin forms
router.get('/all', requirePermission('classes.view'), classController.getAllClassesNoBatch);

router.get('/', requirePermission('classes.view'), classController.getAllClasses);
router.get('/:id', requirePermission('classes.view'), classController.getClassById);

router.post('/', requirePermission('classes.create'), classController.createClass);
router.put('/:id', requirePermission('classes.edit'), classController.updateClass);
router.delete('/:id', requirePermission('classes.delete'), classController.deleteClass);

// Subject management (legacy — not used by the current UI, kept admin-only)
router.post('/:id/subjects', roleCheck('ADMIN'), classController.addSubject);
router.delete('/subjects/:subjectId', roleCheck('ADMIN'), classController.removeSubject);

module.exports = router;
