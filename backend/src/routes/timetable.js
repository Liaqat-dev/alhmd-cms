const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const requirePermission = require('../middleware/requirePermission');

// All routes require authentication
router.use(auth);

// Get timetable for current user (based on role) — personal endpoint, no permission gate
router.get('/my-timetable', (req, res, next) => {
  if (req.user.role === 'TEACHER') {
    return timetableController.getTeacherTimetable(req, res, next);
  } else if (req.user.role === 'STUDENT') {
    return timetableController.getStudentTimetable(req, res, next);
  } else {
    return res.status(400).json({ message: 'Use class-specific endpoint for admin' });
  }
});

router.get('/class/:classId', requirePermission('timetable.view'), timetableController.getTimetableByClass);

// Get timetable by teacher (Admin only — no permission defined for this narrow lookup)
router.get('/teacher/:teacherId', roleCheck('ADMIN'), timetableController.getTimetableByTeacher);

router.post('/', requirePermission('timetable.create'), timetableController.createTimetableEntry);
router.put('/:id', requirePermission('timetable.edit'), timetableController.updateTimetableEntry);
router.delete('/:id', requirePermission('timetable.delete'), timetableController.deleteTimetableEntry);
router.delete('/class/:classId/clear', requirePermission('timetable.delete'), timetableController.clearClassTimetable);

module.exports = router;
