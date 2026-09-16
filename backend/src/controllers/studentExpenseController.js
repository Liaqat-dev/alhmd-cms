const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const EXPENSE_LABELS = {
  ADMISSION_FEE: 'Admission Fee',
  MISC_FEE: 'Misc. Fee',
  BAG: 'Bag',
  UNIFORM: 'Uniform',
  BOOKS: 'Books',
  OTHER: 'Other',
};

const getExpenses = catchAsync(async (req, res) => {
  const { studentId } = req.query;
  if (!studentId) throw new AppError(400, { message: 'studentId is required' });

  const expenses = await prisma.studentExpense.findMany({
    where: { studentId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({ expenses });
});

const createExpense = catchAsync(async (req, res) => {
  const { studentId, type, label, amount, month, year } = req.body;

  if (!studentId || !type || !amount || !month || !year) {
    throw new AppError(400, { message: 'studentId, type, amount, month, year are required' });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError(404, 'Student not found');

  // If a challan for this month already exists, the expense can't be added to it.
  const existingChallan = await prisma.challan.findUnique({
    where: { studentId_month_year: { studentId, month: parseInt(month), year: parseInt(year) } },
  });
  if (existingChallan) {
    throw new AppError(400, { message: 'A challan for this month already exists. Delete it first to add expenses.' });
  }

  const resolvedLabel = label || EXPENSE_LABELS[type] || type;

  const expense = await prisma.studentExpense.create({
    data: {
      studentId,
      type,
      label: resolvedLabel,
      amount: parseFloat(amount),
      month: parseInt(month),
      year: parseInt(year),
      createdBy: req.user.id,
    },
  });

  res.status(201).json({ message: 'Expense added successfully', expense });
});

const updateExpense = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type, label, amount, month, year } = req.body;

  const existing = await prisma.studentExpense.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Expense not found');

  if (existing.challanId) {
    throw new AppError(400, { message: 'Cannot edit an expense that is already linked to a challan' });
  }

  const resolvedLabel = label || (type ? EXPENSE_LABELS[type] : existing.label);

  const expense = await prisma.studentExpense.update({
    where: { id },
    data: {
      ...(type && { type }),
      label: resolvedLabel,
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(month !== undefined && { month: parseInt(month) }),
      ...(year !== undefined && { year: parseInt(year) }),
    },
  });

  res.json({ message: 'Expense updated successfully', expense });
});

const deleteExpense = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.studentExpense.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Expense not found');

  if (existing.challanId) {
    throw new AppError(400, { message: 'Cannot delete an expense that is already linked to a challan' });
  }

  await prisma.studentExpense.delete({ where: { id } });
  res.json({ message: 'Expense deleted successfully' });
});

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
