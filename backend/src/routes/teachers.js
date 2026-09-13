const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Teacher's own classes
router.get('/my-classes', roleCheck('TEACHER'), teacherController.getTeacherClasses);

// Admin only routes
router.get('/', roleCheck('ADMIN'), teacherController.getAllTeachers);
router.get('/:id', roleCheck('ADMIN','TEACHER'), teacherController.getTeacherById);
router.post('/', roleCheck('ADMIN'), teacherController.createTeacher);
router.put('/:id', roleCheck('ADMIN'), teacherController.updateTeacher);
router.delete('/:id', roleCheck('ADMIN'), teacherController.deleteTeacher);

module.exports = router;
