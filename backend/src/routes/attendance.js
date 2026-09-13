const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Teacher routes — marking attendance is the core "create" action here
router.post('/mark', roleCheck('TEACHER', 'ADMIN'), requirePermission('attendance.create'), attendanceController.markAttendance);
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getAttendanceByClass);
router.get('/class/:classId/report', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getClassAttendanceReport);
router.get('/class/:classId/grid', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getClassAttendanceGrid);

// Admin and teacher can view student attendance
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getStudentAttendance);

// Admin can view teacher attendance (auditing teacher punctuality — stays admin-only)
router.get('/teachers/summary', roleCheck('ADMIN'), attendanceController.getTeacherAttendanceSummary);
router.get('/teachers/grid', roleCheck('ADMIN'), attendanceController.getTeacherAttendanceGrid);

// Student can view their own attendance
router.get('/my-attendance', roleCheck('STUDENT'), attendanceController.getMyAttendance);

module.exports = router;
