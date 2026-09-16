const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

router.get('/', requirePermission('reports.view'), reportController.getAllReports);
router.get('/class-summary', requirePermission('reports.view'), reportController.getClassPerformanceSummary);
router.post('/generate', requirePermission('reports.create'), reportController.generateStudentReport);
router.post('/generate-class', requirePermission('reports.create'), reportController.generateClassReports);
router.put('/:id/remarks', requirePermission('reports.edit'), reportController.updateReportRemarks);
router.delete('/:id', requirePermission('reports.delete'), reportController.deleteReport);

// Own-data route — account-kind dispatch, not a permission tier.
router.get('/my-reports', roleCheck('STUDENT'), reportController.getStudentReports);

// Get report by ID — ownership (own report) vs. reports.view enforced in
// the controller, since the owner isn't known until after the DB lookup.
router.get('/:id', reportController.getReportById);

// Download report as PDF — same ownership rule as above.
router.get('/:id/download', reportController.downloadReportPDF);

router.get('/student/:studentId', requirePermission('reports.view'), reportController.getStudentReports);

module.exports = router;
