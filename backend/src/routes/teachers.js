const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');
const allowSelfOrPermission = require('../middleware/allowSelfOrPermission');

// All routes require authentication
router.use(auth);

// Teacher's own classes — account-kind dispatch, not a permission tier: a
// student or admin hitting this wouldn't get "their own classes" back, they
// have none, so this only makes sense for TEACHER callers.
router.get('/my-classes', roleCheck('TEACHER'), teacherController.getTeacherClasses);

router.get('/', requirePermission('teachers.view'), teacherController.getAllTeachers);
// A teacher may always view their own profile; anyone else needs teachers.view.
router.get('/:id', allowSelfOrPermission(u => u.role === 'TEACHER' ? u.id : null, 'teachers.view'), teacherController.getTeacherById);
router.post('/', requirePermission('teachers.create'), teacherController.createTeacher);
router.put('/:id', requirePermission('teachers.edit'), teacherController.updateTeacher);
router.delete('/:id', requirePermission('teachers.delete'), teacherController.deleteTeacher);

module.exports = router;
