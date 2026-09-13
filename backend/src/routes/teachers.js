const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Teacher's own classes
router.get('/my-classes', roleCheck('TEACHER'), teacherController.getTeacherClasses);

// Admin always allowed; Teacher needs the matching permission via their role.
router.get('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('teachers.view'), teacherController.getAllTeachers);
// No blanket permission gate here — a teacher can always view their own
// profile; teacherController enforces teachers.view for viewing others.
router.get('/:id', roleCheck('ADMIN', 'TEACHER'), teacherController.getTeacherById);
router.post('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('teachers.create'), teacherController.createTeacher);
router.put('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('teachers.edit'), teacherController.updateTeacher);
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('teachers.delete'), teacherController.deleteTeacher);

module.exports = router;
