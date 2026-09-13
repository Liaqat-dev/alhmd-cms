const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Exam management (Admin, Teacher)
router.get('/exams', roleCheck('ADMIN', 'TEACHER'), marksController.getAllExams);
router.get('/exams/teacher', roleCheck('TEACHER'), marksController.getTeacherExams);
router.get('/exams/:id', roleCheck('ADMIN', 'TEACHER'), marksController.getExamById);
router.post('/exams', roleCheck('ADMIN', 'TEACHER'), marksController.createExam);
router.put('/exams/:id', roleCheck('ADMIN', 'TEACHER'), marksController.updateExam);
router.delete('/exams/:id', roleCheck('ADMIN'), marksController.deleteExam);

// Marks entry (Teacher, Admin)
router.post('/enter', roleCheck('ADMIN', 'TEACHER'), marksController.enterMarks);
router.get('/class/:examId', roleCheck('ADMIN', 'TEACHER'), marksController.getClassMarks);

// Student marks (Student can view their own)
router.get('/my-marks', roleCheck('STUDENT'), marksController.getStudentMarks);
router.get('/my-marks/subjects', roleCheck('STUDENT'), marksController.getSubjectWiseMarks);

// Admin view student marks
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), marksController.getStudentMarks);
router.get('/student/:studentId/subjects', roleCheck('ADMIN', 'TEACHER'), marksController.getSubjectWiseMarks);

module.exports = router;
