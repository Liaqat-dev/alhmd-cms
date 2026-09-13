const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Get all subjects (Admin, Teacher)
router.get('/', roleCheck('ADMIN', 'TEACHER'), subjectController.getAllSubjects);

// Get subject by ID (Admin, Teacher)
router.get('/:id', roleCheck('ADMIN', 'TEACHER'), subjectController.getSubjectById);

// Create subject (Admin only)
router.post('/', roleCheck('ADMIN'), subjectController.createSubject);

// Bulk create subjects (Admin only)
router.post('/bulk', roleCheck('ADMIN'), subjectController.bulkCreateSubjects);

// Update subject (Admin only)
router.put('/:id', roleCheck('ADMIN'), subjectController.updateSubject);

// Delete subject (Admin only)
router.delete('/:id', roleCheck('ADMIN'), subjectController.deleteSubject);

module.exports = router;
