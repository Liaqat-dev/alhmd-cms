const express = require('express');
const router = express.Router();
const morningFeeController = require('../controllers/morningFeeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);

// Admin routes
router.get('/', roleCheck('ADMIN'), morningFeeController.getAllChallans);
router.get('/statistics', roleCheck('ADMIN'), morningFeeController.getFeeStatistics);
router.get('/payment-history', roleCheck('ADMIN'), morningFeeController.getPaymentHistory);
router.post('/generate', roleCheck('ADMIN'), morningFeeController.generateChallan);
router.post('/generate-class', roleCheck('ADMIN'), morningFeeController.generateClassChallans);
router.post('/update-overdue', roleCheck('ADMIN'), morningFeeController.updateOverdueChallans);
router.put('/:id/payment', roleCheck('ADMIN'), morningFeeController.updateChallanPayment);
router.delete('/:id', roleCheck('ADMIN'), morningFeeController.deleteChallan);

// Student routes
router.get('/my-challans', roleCheck('STUDENT'), morningFeeController.getStudentChallans);

// Download challan PDF (Admin, Student)
router.get('/:id/pdf', roleCheck('ADMIN', 'STUDENT'), morningFeeController.downloadChallanPDF);

// Get single challan (Admin, Student)
router.get('/:id', roleCheck('ADMIN', 'STUDENT'), morningFeeController.getChallanById);

// Get student's challans (Admin view)
router.get('/student/:studentId', roleCheck('ADMIN'), morningFeeController.getStudentChallans);

module.exports = router;
