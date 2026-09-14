const express = require('express');
const router = express.Router();
const paymentInfoController = require('../controllers/paymentInfoController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);

// Read access: ADMIN (Configurations page) and STUDENT (fee payment details)
router.get('/', roleCheck('ADMIN', 'STUDENT'), paymentInfoController.getAllPaymentInfo);
router.get('/:id', roleCheck('ADMIN', 'STUDENT'), paymentInfoController.getPaymentInfoById);

// Writes: ADMIN only
router.post('/', roleCheck('ADMIN'), paymentInfoController.createPaymentInfo);
router.put('/:id', roleCheck('ADMIN'), paymentInfoController.updatePaymentInfo);
router.delete('/:id', roleCheck('ADMIN'), paymentInfoController.deletePaymentInfo);

module.exports = router;
