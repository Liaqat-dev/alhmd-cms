const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// ── Student attendance ────────────────────────────────────────────────────────
router.post('/mark', requirePermission('attendance.create'), attendanceController.markAttendance);
router.get('/class/:classId', requirePermission('attendance.view'), attendanceController.getAttendanceByClass);
router.get('/class/:classId/report', requirePermission('attendance.view'), attendanceController.getClassAttendanceReport);
router.get('/class/:classId/grid', requirePermission('attendance.view'), attendanceController.getClassAttendanceGrid);
router.get('/student/:studentId', requirePermission('attendance.view'), attendanceController.getStudentAttendance);

// Own-data route — account-kind dispatch, not a permission tier.
router.get('/my-attendance', roleCheck('STUDENT'), attendanceController.getMyAttendance);

// ── Teacher attendance — separate permission from student attendance, since
// marking a colleague's attendance is a distinct, more sensitive action ──────
router.post('/mark-teachers', requirePermission('teacherAttendance.create'), attendanceController.markTeacherAttendance);
router.get('/teachers', requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceByDate);
router.get('/teachers/report', requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceReport);
router.get('/teachers/grid', requirePermission('teacherAttendance.view'), attendanceController.getTeacherAttendanceGrid);

module.exports = router;
