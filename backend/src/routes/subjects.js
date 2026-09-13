const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get all subjects (Admin, Teacher)
router.get('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.view'), subjectController.getAllSubjects);

// Get subject by ID (Admin, Teacher)
router.get('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.view'), subjectController.getSubjectById);

// Create subject
router.post('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.create'), subjectController.createSubject);

// Bulk create subjects
router.post('/bulk', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.create'), subjectController.bulkCreateSubjects);

// Update subject
router.put('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.edit'), subjectController.updateSubject);

// Delete subject
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('subjects.delete'), subjectController.deleteSubject);

module.exports = router;
