const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Admin/Teacher routes
router.get('/', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.view'), reportController.getAllReports);
router.get('/class-summary', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.view'), reportController.getClassPerformanceSummary);
router.post('/generate', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.create'), reportController.generateStudentReport);
router.post('/generate-class', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.create'), reportController.generateClassReports);
router.put('/:id/remarks', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.edit'), reportController.updateReportRemarks);
router.delete('/:id', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.delete'), reportController.deleteReport);

// Student routes
router.get('/my-reports', roleCheck('STUDENT'), reportController.getStudentReports);

// Get report by ID (Admin, Teacher, Student — ownership enforced in controller)
router.get('/:id', reportController.getReportById);

// Admin/Teacher view student reports
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), requirePermission('reports.view'), reportController.getStudentReports);

module.exports = router;
