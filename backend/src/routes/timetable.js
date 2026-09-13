const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All routes require authentication
router.use(auth);

// Get timetable for current user (based on role)
router.get('/my-timetable', (req, res, next) => {
  if (req.user.role === 'TEACHER') {
    return timetableController.getTeacherTimetable(req, res, next);
  } else if (req.user.role === 'STUDENT') {
    return timetableController.getStudentTimetable(req, res, next);
  } else {
    return res.status(400).json({ message: 'Use class-specific endpoint for admin' });
  }
});

// Get timetable by class (Admin, Teacher)
router.get('/class/:classId', roleCheck('ADMIN', 'TEACHER'), timetableController.getTimetableByClass);

// Get timetable by teacher (Admin only)
router.get('/teacher/:teacherId', roleCheck('ADMIN'), timetableController.getTimetableByTeacher);

// Admin only routes
router.post('/', roleCheck('ADMIN'), timetableController.createTimetableEntry);
router.put('/:id', roleCheck('ADMIN'), timetableController.updateTimetableEntry);
router.delete('/:id', roleCheck('ADMIN'), timetableController.deleteTimetableEntry);
router.delete('/class/:classId/clear', roleCheck('ADMIN'), timetableController.clearClassTimetable);

module.exports = router;
