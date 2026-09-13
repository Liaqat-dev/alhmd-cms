const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Get all classes — for admin forms
router.get('/all', roleCheck('ADMIN', 'TEACHER'), classController.getAllClassesNoBatch);

// Get all classes (accessible by admin and teacher)
router.get('/', roleCheck('ADMIN', 'TEACHER'), classController.getAllClasses);
router.get('/:id', roleCheck('ADMIN', 'TEACHER'), classController.getClassById);

// Admin only routes
router.post('/', roleCheck('ADMIN'), classController.createClass);
router.put('/:id', roleCheck('ADMIN'), classController.updateClass);
router.delete('/:id', roleCheck('ADMIN'), classController.deleteClass);

// Subject management
router.post('/:id/subjects', roleCheck('ADMIN'), classController.addSubject);
router.delete('/subjects/:subjectId', roleCheck('ADMIN'), classController.removeSubject);

module.exports = router;
