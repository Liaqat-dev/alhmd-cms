const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Exam management (Admin, Teacher)
router.get('/exams', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.view'), marksController.getAllExams);
router.get('/exams/teacher', roleCheck('TEACHER'), marksController.getTeacherExams);
router.get('/exams/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.view'), marksController.getExamById);
router.post('/exams', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.create'), marksController.createExam);
router.put('/exams/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.edit'), marksController.updateExam);
router.delete('/exams/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.delete'), marksController.deleteExam);

// Marks entry (Teacher, Admin) — entering/updating marks is an edit action
router.post('/enter', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.edit'), marksController.enterMarks);
router.get('/class/:examId', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.view'), marksController.getClassMarks);

// Student marks (Student can view their own)
router.get('/my-marks', roleCheck('STUDENT'), marksController.getStudentMarks);
router.get('/my-marks/subjects', roleCheck('STUDENT'), marksController.getSubjectWiseMarks);

// Admin/Teacher view student marks
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.view'), marksController.getStudentMarks);
router.get('/student/:studentId/subjects', roleCheck('ADMIN', 'TEACHER'), requirePermission('marks.view'), marksController.getSubjectWiseMarks);

module.exports = router;
