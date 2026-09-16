const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateChallanPDF } = require('../utils/challanPDF');
const { CHALLAN_DUE_DATE_DAY } = require('../config/constants');

const generateChallanNumber = async (month, year) => {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `CGA-M-${year}-${monthStr}-`;
  // Use the highest existing sequence (not the count) so that deleting a
  // challan in the middle never causes the next number to collide.
  const last = await prisma.challan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
    select: { challanNumber: true }
  });
  const lastSeq = last ? parseInt(last.challanNumber.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`;
};

const calculateArrears = async (studentId, currentMonth, currentYear) => {
  const unpaidChallans = await prisma.challan.findMany({
    where: {
      studentId,
      status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
      OR: [
        { year: { lt: currentYear } },
        { year: currentYear, month: { lt: currentMonth } }
      ]
    }
  });
  return unpaidChallans.reduce((total, c) => total + (Number(c.totalAmount) - Number(c.paidAmount)), 0);
};

// Include shape used in all read queries
const studentInclude = {
  select: {
    id: true,
    name: true,
    rollNumber: true,
    fatherName: true,
    enrollment: { include: { class: true } }
  }
};

// Map DB row so frontend gets challan.student.class
const mapChallan = (c) => ({
  ...c,
  student: { ...c.student, class: c.student.enrollment?.class || null }
});

const getAllChallans = catchAsync(async (req, res) => {
  const { studentId, classId, month, year, status } = req.query;
  const where = {};
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (classId) {
    where.student = { enrollment: { classId: classId, isActive: true } };
  }

  const challans = await prisma.challan.findMany({
    where,
    include: { expenses: true, student: studentInclude },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }]
  });

  res.json({ challans: challans.map(mapChallan) });
});

const getChallanById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { expenses: true, student: studentInclude }
  });
  if (!challan) throw new AppError(404, 'Challan not found');
  res.json({ challan: mapChallan(challan) });
});

const getStudentChallans = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id || req.params.studentId;
  if (!studentId) throw new AppError(400, { message: 'Student ID required' });

  const challans = await prisma.challan.findMany({
    where: { studentId },
    include: { expenses: true, student: studentInclude },
    orderBy: [{ year: 'desc' }, { month: 'desc' }]
  });

  const now = new Date();
  const arrears = await calculateArrears(studentId, now.getMonth() + 1, now.getFullYear());

  res.json({ challans: challans.map(mapChallan), arrears });
});

const generateChallan = catchAsync(async (req, res) => {
  const { studentId, month, year, discount, remarks } = req.body;
  if (!studentId || !month || !year) {
    throw new AppError(400, { message: 'Student ID, month, and year are required' });
  }

  const existing = await prisma.challan.findUnique({
    where: { studentId_month_year: { studentId, month: parseInt(month), year: parseInt(year) } }
  });
  if (existing) throw new AppError(400, { message: 'Challan already exists for this month' });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, rollNumber: true, enrollment: { include: { class: true } } }
  });
  if (!student) throw new AppError(404, 'Student not found');
  if (!student.enrollment) throw new AppError(400, { message: 'Student not enrolled in any class' });

  const monthlyFee = Number(student.enrollment.monthlyFee);

  const arrears = await calculateArrears(studentId, parseInt(month), parseInt(year));
  const discountAmount = discount ? parseFloat(discount) : 0;

  const expenses = await prisma.studentExpense.findMany({
    where: { studentId, month: parseInt(month), year: parseInt(year), challanId: null }
  });
  const additionalCharges = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const totalAmount = monthlyFee + arrears + additionalCharges - discountAmount;
  const challanNumber = await generateChallanNumber(parseInt(month), parseInt(year));
  const dueDate = new Date(parseInt(year), parseInt(month) - 1, CHALLAN_DUE_DATE_DAY);

  const challan = await prisma.$transaction(async (tx) => {
    const created = await tx.challan.create({
      data: {
        challanNumber, studentId, month: parseInt(month), year: parseInt(year),
        monthlyFee, arrears, discount: discountAmount, additionalCharges, totalAmount, dueDate,
        remarks, createdBy: req.user.id
      },
      include: { expenses: true, student: studentInclude }
    });

    if (expenses.length > 0) {
      await tx.studentExpense.updateMany({
        where: { id: { in: expenses.map(e => e.id) } },
        data: { challanId: created.id }
      });
    }

    await tx.challan.updateMany({
      where: {
        studentId,
        status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
        OR: [
          { year: { lt: parseInt(year) } },
          { year: parseInt(year), month: { lt: parseInt(month) } }
        ]
      },
      data: { status: 'ROLLED_OVER', rolledIntoId: created.id }
    });

    return created;
  });

  res.status(201).json({ message: 'Challan generated successfully', challan: mapChallan(challan) });
});

const generateClassChallans = catchAsync(async (req, res) => {
  const { classId, month, year } = req.body;
  if (!classId || !month || !year) {
    throw new AppError(400, { message: 'Class ID, month, and year are required' });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: classId, isActive: true },
    include: { student: true }
  });

  const results = { created: 0, skipped: 0, errors: [] };

  for (const enrollment of enrollments) {
    const student = enrollment.student;
    try {
      const existing = await prisma.challan.findUnique({
        where: { studentId_month_year: { studentId: student.id, month: parseInt(month), year: parseInt(year) } }
      });
      if (existing) { results.skipped++; continue; }

      const arrears = await calculateArrears(student.id, parseInt(month), parseInt(year));
      const challanNumber = await generateChallanNumber(parseInt(month), parseInt(year));
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, CHALLAN_DUE_DATE_DAY);
      const monthlyFee = Number(enrollment.monthlyFee);

      const expenses = await prisma.studentExpense.findMany({
        where: { studentId: student.id, month: parseInt(month), year: parseInt(year), challanId: null }
      });
      const additionalCharges = expenses.reduce((s, e) => s + Number(e.amount), 0);
      const totalAmount = monthlyFee + arrears + additionalCharges;

      await prisma.$transaction(async (tx) => {
        const created = await tx.challan.create({
          data: {
            challanNumber, studentId: student.id, month: parseInt(month), year: parseInt(year),
            monthlyFee, arrears, additionalCharges, totalAmount, dueDate, createdBy: req.user.id
          }
        });
        if (expenses.length > 0) {
          await tx.studentExpense.updateMany({
            where: { id: { in: expenses.map(e => e.id) } },
            data: { challanId: created.id }
          });
        }
        await tx.challan.updateMany({
          where: {
            studentId: student.id,
            status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] },
            OR: [
              { year: { lt: parseInt(year) } },
              { year: parseInt(year), month: { lt: parseInt(month) } }
            ]
          },
          data: { status: 'ROLLED_OVER', rolledIntoId: created.id }
        });
      });
      results.created++;
    } catch (err) {
      results.errors.push({ studentId: student.id, error: err.message });
    }
  }

  res.status(201).json({
    message: `Challans generated: ${results.created} created, ${results.skipped} skipped`,
    results
  });
});

const updateChallanPayment = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { paidAmount, status, remarks, paymentMethod } = req.body;

  const existing = await prisma.challan.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Challan not found');

  const updateData = {};
  if (paidAmount !== undefined) {
    updateData.paidAmount = parseFloat(paidAmount);
    updateData.paidDate = new Date();
    const totalAmount = Number(existing.totalAmount);
    const paid = parseFloat(paidAmount);
    if (paid >= totalAmount) updateData.status = 'PAID';
    else if (paid > 0) updateData.status = 'PARTIAL';
  }
  if (status) updateData.status = status;
  if (remarks) updateData.remarks = remarks;

  const challan = await prisma.challan.update({
    where: { id },
    data: updateData,
    include: { student: studentInclude }
  });

  if (paidAmount !== undefined && parseFloat(paidAmount) > 0) {
    const previousBalance = Number(existing.totalAmount) - Number(existing.paidAmount);
    const newBalance = Number(challan.totalAmount) - Number(challan.paidAmount);
    await prisma.paymentHistory.create({
      data: {
        paymentType: 'FEE',
        challanId: id,
        amount: parseFloat(paidAmount) - Number(existing.paidAmount),
        paymentMethod: paymentMethod || 'CASH',
        previousBalance, newBalance,
        receivedBy: req.user.id
      }
    });
  }

  res.json({ message: 'Challan updated successfully', challan: mapChallan(challan) });
});

const updateOverdueChallans = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await prisma.challan.updateMany({
    where: { status: 'UNPAID', dueDate: { lt: today } },
    data: { status: 'OVERDUE' }
  });
  res.json({ message: `Updated ${result.count} challans to overdue status`, count: result.count });
});

const deleteChallan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const challan = await prisma.challan.findUnique({ where: { id } });
  if (!challan) throw new AppError(404, 'Challan not found');
  if (challan.status === 'PAID') throw new AppError(400, { message: 'Cannot delete a paid challan' });
  if (Number(challan.paidAmount) > 0) throw new AppError(400, { message: 'Cannot delete a partially paid challan' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    // Restore any challans that were rolled into this one
    const rolledChallans = await tx.challan.findMany({
      where: { rolledIntoId: id }
    });

    for (const rc of rolledChallans) {
      const restored = rc.dueDate < today ? 'OVERDUE' : 'UNPAID';
      await tx.challan.update({
        where: { id: rc.id },
        data: { status: restored, rolledIntoId: null }
      });
    }

    await tx.challan.delete({ where: { id } });
  });

  res.json({ message: 'Challan deleted successfully' });
});

const getFeeStatistics = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();

  const challans = await prisma.challan.findMany({
    where: { month: currentMonth, year: currentYear }
  });

  const statistics = {
    totalChallans: challans.length,
    totalAmount: challans.reduce((sum, c) => sum + Number(c.totalAmount), 0),
    paidAmount: challans.reduce((sum, c) => sum + Number(c.paidAmount), 0),
    unpaidCount: challans.filter(c => c.status === 'UNPAID').length,
    paidCount: challans.filter(c => c.status === 'PAID').length,
    partialCount: challans.filter(c => c.status === 'PARTIAL').length,
    overdueCount: challans.filter(c => c.status === 'OVERDUE').length
  };
  statistics.pendingAmount = statistics.totalAmount - statistics.paidAmount;
  statistics.collectionRate = statistics.totalAmount > 0
    ? ((statistics.paidAmount / statistics.totalAmount) * 100).toFixed(2) : 0;

  res.json({ statistics, month: currentMonth, year: currentYear });
});

const downloadChallanPDF = catchAsync(async (req, res) => {
  const { id } = req.params;
  const challan = await prisma.challan.findUnique({
    where: { id },
    include: { expenses: true, student: studentInclude }
  });
  if (!challan) throw new AppError(404, 'Challan not found');
  if (req.user.role === 'STUDENT' && challan.studentId !== req.user.student?.id) {
    throw new AppError(403, { message: 'Access denied' });
  }

  const paymentInfo = await prisma.paymentInfo.findFirst({ orderBy: { createdAt: 'asc' } });

  const mapped = mapChallan(challan);
  const filename = `challan-${challan.challanNumber}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  generateChallanPDF(mapped, res, paymentInfo);
});

const getPaymentHistory = catchAsync(async (req, res) => {
  const { studentId, month, year } = req.query;
  const where = { paymentType: 'FEE' };

  if (studentId) {
    where.challan = { studentId };
  }
  if (month || year) {
    where.challan = where.challan || {};
    if (month) where.challan.month = parseInt(month);
    if (year) where.challan.year = parseInt(year);
  }

  const payments = await prisma.paymentHistory.findMany({
    where,
    include: {
      challan: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
              enrollment: { include: { class: true } }
            }
          }
        }
      },
      receivedByUser: { select: { id: true, email: true, admin: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ payments });
});

module.exports = {
  getAllChallans, getChallanById, getStudentChallans, generateChallan, generateClassChallans,
  updateChallanPayment, updateOverdueChallans, deleteChallan, getFeeStatistics, downloadChallanPDF,
  getPaymentHistory
};
