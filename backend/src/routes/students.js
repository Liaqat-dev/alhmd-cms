const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get student by ID (Admin, Teacher, or Student their own profile)
router.get('/:id', studentController.getStudentById);

// Admin always allowed; Teacher needs the matching permission via their role.
router.get('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('students.view'), studentController.getAllStudents);
router.post('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('students.create'), studentController.createStudent);
router.put('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('students.edit'), studentController.updateStudent);
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('students.delete'), studentController.deleteStudent);

// Get students by class (for teachers marking attendance)
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), requirePermission('students.view'), studentController.getStudentsByClass);

module.exports = router;
