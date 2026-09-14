const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Exam management
router.get('/exams', requirePermission('marks.view'), marksController.getAllExams);
// Own-data route — account-kind dispatch, not a permission tier.
router.get('/exams/teacher', roleCheck('TEACHER'), marksController.getTeacherExams);
router.get('/exams/:id', requirePermission('marks.view'), marksController.getExamById);
router.post('/exams', requirePermission('marks.create'), marksController.createExam);
router.put('/exams/:id', requirePermission('marks.edit'), marksController.updateExam);
router.delete('/exams/:id', requirePermission('marks.delete'), marksController.deleteExam);

// Marks entry — entering/updating marks is an edit action
router.post('/enter', requirePermission('marks.edit'), marksController.enterMarks);
router.get('/class/:examId', requirePermission('marks.view'), marksController.getClassMarks);

// Own-data routes — a student viewing their own marks.
router.get('/my-marks', roleCheck('STUDENT'), marksController.getStudentMarks);
router.get('/my-marks/subjects', roleCheck('STUDENT'), marksController.getSubjectWiseMarks);

router.get('/student/:studentId', requirePermission('marks.view'), marksController.getStudentMarks);
router.get('/student/:studentId/subjects', requirePermission('marks.view'), marksController.getSubjectWiseMarks);

module.exports = router;
