const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Admin/Teacher routes
router.get('/', roleCheck('ADMIN', 'TEACHER'), reportController.getAllReports);
router.get('/class-summary', roleCheck('ADMIN', 'TEACHER'), reportController.getClassPerformanceSummary);
router.post('/generate', roleCheck('ADMIN', 'TEACHER'), reportController.generateStudentReport);
router.post('/generate-class', roleCheck('ADMIN', 'TEACHER'), reportController.generateClassReports);
router.put('/:id/remarks', roleCheck('ADMIN', 'TEACHER'), reportController.updateReportRemarks);
router.delete('/:id', roleCheck('ADMIN'), reportController.deleteReport);

// Student routes
router.get('/my-reports', roleCheck('STUDENT'), reportController.getStudentReports);

// Get report by ID (Admin, Teacher, Student)
router.get('/:id', reportController.getReportById);

// Admin view student reports
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), reportController.getStudentReports);

module.exports = router;
