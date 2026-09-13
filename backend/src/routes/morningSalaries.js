const express = require('express');
const router = express.Router();
const morningSalaryController = require('../controllers/morningSalaryController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);

// Teacher-accessible: own salary history only (ownership enforced in controller)
router.get('/teacher/:teacherId', roleCheck('ADMIN', 'TEACHER'), morningSalaryController.getTeacherHistory);

// Admin-only routes
router.use(roleCheck('ADMIN'));
router.get('/calculate/:teacherId', morningSalaryController.previewSalary);
router.get('/statistics', morningSalaryController.getStatistics);
router.post('/generate', morningSalaryController.generateAll);
router.post('/generate/:teacherId', morningSalaryController.generateSingle);
router.get('/', morningSalaryController.getAll);
router.get('/:id', morningSalaryController.getById);
router.put('/:id/status', morningSalaryController.updateStatus);
router.delete('/:id', morningSalaryController.deleteSalary);

module.exports = router;
