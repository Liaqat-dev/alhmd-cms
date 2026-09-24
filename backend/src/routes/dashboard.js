const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Role-specific dashboard routes
router.get('/admin', roleCheck('ADMIN'), dashboardController.getAdminStats);
router.get('/teacher', roleCheck('TEACHER'), dashboardController.getTeacherStats);
router.get('/student', roleCheck('STUDENT'), dashboardController.getStudentDashboard);

// Shared by the admin and teacher dashboards — the controller scopes the
// selectable classes to whoever is asking.
router.get('/attendance-week', roleCheck('ADMIN', 'TEACHER'), dashboardController.getWeeklyAttendance);

module.exports = router;
