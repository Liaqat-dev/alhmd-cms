const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);

// Admin routes
router.get('/', roleCheck('ADMIN'), feeController.getAllChallans);
router.get('/statistics', roleCheck('ADMIN'), feeController.getFeeStatistics);
router.get('/payment-history', roleCheck('ADMIN'), feeController.getPaymentHistory);
router.post('/generate', roleCheck('ADMIN'), feeController.generateChallan);
router.post('/generate-class', roleCheck('ADMIN'), feeController.generateClassChallans);
router.post('/update-overdue', roleCheck('ADMIN'), feeController.updateOverdueChallans);
router.put('/:id/payment', roleCheck('ADMIN'), feeController.updateChallanPayment);
router.delete('/:id', roleCheck('ADMIN'), feeController.deleteChallan);

// Student routes
router.get('/my-challans', roleCheck('STUDENT'), feeController.getStudentChallans);

// Download challan PDF (Admin, Student)
router.get('/:id/pdf', roleCheck('ADMIN', 'STUDENT'), feeController.downloadChallanPDF);

// Get single challan (Admin, Student)
router.get('/:id', roleCheck('ADMIN', 'STUDENT'), feeController.getChallanById);

// Get student's challans (Admin view)
router.get('/student/:studentId', roleCheck('ADMIN'), feeController.getStudentChallans);

module.exports = router;
