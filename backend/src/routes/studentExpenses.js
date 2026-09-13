const express = require('express');
const router = express.Router();
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/studentExpenseController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.use(auth);
router.use(roleCheck('ADMIN'));

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
