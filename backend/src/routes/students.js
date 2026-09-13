const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Get student by ID (Admin, Teacher, or Student their own profile)
router.get('/:id', studentController.getStudentById);

// Admin only routes
router.get('/', roleCheck('ADMIN', 'TEACHER'), studentController.getAllStudents);
router.post('/', roleCheck('ADMIN'), studentController.createStudent);
router.put('/:id', roleCheck('ADMIN'), studentController.updateStudent);
router.delete('/:id', roleCheck('ADMIN'), studentController.deleteStudent);

// Get students by class (for teachers marking attendance)
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), studentController.getStudentsByClass);

module.exports = router;
