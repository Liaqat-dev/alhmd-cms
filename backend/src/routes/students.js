const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');
const requirePermission = require('../middleware/requirePermission');
const allowSelfOrPermission = require('../middleware/allowSelfOrPermission');

// All routes require authentication
router.use(auth);

// A student may always view their own profile; anyone else needs students.view.
router.get('/:id', allowSelfOrPermission(u => u.role === 'STUDENT' ? u.id : null, 'students.view'), studentController.getStudentById);

router.get('/', requirePermission('students.view'), studentController.getAllStudents);
router.post('/', requirePermission('students.create'), studentController.createStudent);
router.put('/:id', requirePermission('students.edit'), studentController.updateStudent);
router.delete('/:id', requirePermission('students.delete'), studentController.deleteStudent);

// Get students by class (for teachers marking attendance)
router.get('/class/:classId', requirePermission('students.view'), studentController.getStudentsByClass);

module.exports = router;
