const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Teacher routes
router.post('/mark', roleCheck('TEACHER','ADMIN'), attendanceController.markAttendance);
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), attendanceController.getAttendanceByClass);
router.get('/class/:classId/report', roleCheck('ADMIN', 'TEACHER'), attendanceController.getClassAttendanceReport);
router.get('/class/:classId/grid', roleCheck('ADMIN', 'TEACHER'), attendanceController.getClassAttendanceGrid);

// Admin and teacher can view student attendance
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), attendanceController.getStudentAttendance);

// Admin can view teacher attendance
router.get('/teachers/summary', roleCheck('ADMIN'), attendanceController.getTeacherAttendanceSummary);
router.get('/teachers/grid', roleCheck('ADMIN'), attendanceController.getTeacherAttendanceGrid);

// Student can view their own attendance
router.get('/my-attendance', roleCheck('STUDENT'), attendanceController.getMyAttendance);

module.exports = router;
