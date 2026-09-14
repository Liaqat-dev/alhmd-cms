const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// GET /payment-info
const getAllPaymentInfo = catchAsync(async (req, res) => {
  const rows = await prisma.paymentInfo.findMany({ orderBy: { createdAt: 'asc' } });
  res.json({ paymentInfo: rows });
});

// GET /payment-info/:id
const getPaymentInfoById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const row = await prisma.paymentInfo.findUnique({ where: { id: Number(id) } });
  if (!row) throw new AppError(404, 'Payment info not found');
  res.json({ paymentInfo: row });
});

// POST /payment-info
const createPaymentInfo = catchAsync(async (req, res) => {
  const { bankName, accountTitle, accountNumber, notes } = req.body;

  if (!bankName?.trim() || !accountTitle?.trim() || !accountNumber?.trim()) {
    throw new AppError(400, { message: 'Bank name, account title and account number are required' });
  }

  const row = await prisma.paymentInfo.create({
    data: {
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      notes: notes?.trim() || null,
    },
  });

  res.status(201).json({ message: 'Payment info created successfully', paymentInfo: row });
});

// PUT /payment-info/:id
const updatePaymentInfo = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { bankName, accountTitle, accountNumber, notes } = req.body;

  const existing = await prisma.paymentInfo.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AppError(404, 'Payment info not found');

  if (bankName !== undefined && !bankName.trim()) {
    throw new AppError(400, { bankName: 'Bank name is required' });
  }
  if (accountTitle !== undefined && !accountTitle.trim()) {
    throw new AppError(400, { accountTitle: 'Account title is required' });
  }
  if (accountNumber !== undefined && !accountNumber.trim()) {
    throw new AppError(400, { accountNumber: 'Account number is required' });
  }

  const row = await prisma.paymentInfo.update({
    where: { id: Number(id) },
    data: {
      ...(bankName !== undefined && { bankName: bankName.trim() }),
      ...(accountTitle !== undefined && { accountTitle: accountTitle.trim() }),
      ...(accountNumber !== undefined && { accountNumber: accountNumber.trim() }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
    },
  });

  res.json({ message: 'Payment info updated successfully', paymentInfo: row });
});

// DELETE /payment-info/:id
const deletePaymentInfo = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.paymentInfo.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new AppError(404, 'Payment info not found');

  await prisma.paymentInfo.delete({ where: { id: Number(id) } });

  res.json({ message: 'Payment info deleted successfully' });
});

module.exports = {
  getAllPaymentInfo,
  getPaymentInfoById,
  createPaymentInfo,
  updatePaymentInfo,
  deletePaymentInfo,
};
