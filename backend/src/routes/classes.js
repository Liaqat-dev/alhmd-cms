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

// Promotion & graduation — both rewrite a whole cohort's enrollments, so they
// need class AND student rights. Chaining two requirePermission calls gives
// the AND; a single call is any-of. (An ADMIN passes both regardless.)
const canMoveCohort = [requirePermission('classes.edit'), requirePermission('students.edit')];

router.get('/:id/promotion-targets', ...canMoveCohort, classController.getPromotionTargets);
router.post('/:id/promote', ...canMoveCohort, classController.promoteClass);
router.post('/:id/graduate', ...canMoveCohort, classController.graduateClass);

// Subject management (legacy — not used by the current UI, kept admin-only)
router.post('/:id/subjects', roleCheck('ADMIN'), classController.addSubject);
router.delete('/subjects/:subjectId', roleCheck('ADMIN'), classController.removeSubject);

module.exports = router;
