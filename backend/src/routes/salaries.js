const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);

// Teacher-accessible: own salary history only (ownership enforced in controller)
router.get('/teacher/:teacherId', roleCheck('ADMIN', 'TEACHER'), salaryController.getTeacherHistory);

// Admin-only routes
router.use(roleCheck('ADMIN'));
router.get('/calculate/:teacherId', salaryController.previewSalary);
router.get('/statistics', salaryController.getStatistics);
router.post('/generate', salaryController.generateAll);
router.post('/generate/:teacherId', salaryController.generateSingle);
router.get('/', salaryController.getAll);
router.get('/:id', salaryController.getById);
router.put('/:id/status', salaryController.updateStatus);
router.delete('/:id', salaryController.deleteSalary);

module.exports = router;
