const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// ── Student attendance ────────────────────────────────────────────────────────
router.post('/mark', roleCheck('TEACHER', 'ADMIN'), requirePermission('attendance.create'), attendanceController.markAttendance);
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getAttendanceByClass);
router.get('/class/:classId/report', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getClassAttendanceReport);
router.get('/class/:classId/grid', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getClassAttendanceGrid);
router.get('/student/:studentId', roleCheck('ADMIN', 'TEACHER'), requirePermission('attendance.view'), attendanceController.getStudentAttendance);

// Student can view their own attendance
router.get('/my-attendance', roleCheck('STUDENT'), attendanceController.getMyAttendance);

// ── Teacher attendance — separate permission from student attendance, since
// marking a colleague's attendance is a distinct, more sensitive action ──────
router.post('/mark-teachers', roleCheck('ADMIN', 'TEACHER'), requirePermission('teacherAttendance.create'), attendanceController.markTeacherAttendance);
router.get('/teachers', roleCheck('ADMIN', 'TEACHER'), requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceByDate);
router.get('/teachers/report', roleCheck('ADMIN', 'TEACHER'), requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceReport);
router.get('/teachers/grid', roleCheck('ADMIN', 'TEACHER'), requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceGrid);

module.exports = router;
