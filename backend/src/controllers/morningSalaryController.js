const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Reads manually set salary fields from the teacher profile
async function getTeacherSalaryFromProfile(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw new AppError(404, 'Teacher not found');

  const basicSalary   = parseInt(teacher.basicSalary)   || 0;
  const additionalPay = parseInt(teacher.additionalPay) || 0;
  const totalSalary   = basicSalary + additionalPay;

  return {
    teacherId, teacherName: teacher.name,
    basicSalary, additionalPay, totalSalary,
  };
}

const previewSalary = catchAsync(async (req, res) => {
  const { teacherId } = req.params;
  const calculation = await getTeacherSalaryFromProfile(teacherId);
  res.json({ calculation });
});

const generateAll = catchAsync(async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) throw new AppError(400, { message: 'Month and year are required' });

  const teachers = await prisma.teacher.findMany();

  const results = [];
  const errors = [];

  for (const teacher of teachers) {
    try {
      const existing = await prisma.morningSalary.findUnique({
        where: { teacherId_month_year: { teacherId: teacher.id, month: parseInt(month), year: parseInt(year) } },
      });
      if (existing) {
        errors.push({ teacherId: teacher.id, name: teacher.name, error: 'Already generated' });
        continue;
      }

      const calc = await getTeacherSalaryFromProfile(teacher.id);

      const salary = await prisma.morningSalary.create({
        data: {
          teacherId: teacher.id, month: parseInt(month), year: parseInt(year),
          basicSalary: calc.basicSalary,
          additionalPay: calc.additionalPay,
          totalSalary: calc.totalSalary,
          generatedBy: req.user.id,
        },
        include: { teacher: true },
      });

      results.push(salary);
    } catch (err) {
      errors.push({ teacherId: teacher.id, name: teacher.name, error: err.message });
    }
  }

  res.json({
    message: `Generated ${results.length} morning salary records`,
    generated: results.length, skipped: errors.length, errors,
  });
});

const generateSingle = catchAsync(async (req, res) => {
  const { teacherId } = req.params;
  const { month, year } = req.body;
  if (!month || !year) throw new AppError(400, { message: 'Month and year are required' });

  const existing = await prisma.morningSalary.findUnique({
    where: { teacherId_month_year: { teacherId, month: parseInt(month), year: parseInt(year) } },
  });
  if (existing) throw new AppError(400, { message: 'Salary already generated for this teacher/month/year' });

  const calc = await getTeacherSalaryFromProfile(teacherId);

  const salary = await prisma.morningSalary.create({
    data: {
      teacherId, month: parseInt(month), year: parseInt(year),
      basicSalary: calc.basicSalary,
      additionalPay: calc.additionalPay,
      totalSalary: calc.totalSalary,
      generatedBy: req.user.id,
    },
    include: { teacher: true },
  });

  res.status(201).json({ message: 'Morning salary generated successfully', salary });
});

const getAll = catchAsync(async (req, res) => {
  const { month, year, status } = req.query;
  const where = {};
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);
  if (status) where.status = status;

  const salaries = await prisma.morningSalary.findMany({
    where,
    include: { teacher: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ salaries });
});

const getStatistics = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const where = {};
  if (month) where.month = parseInt(month);
  if (year) where.year = parseInt(year);

  const salaries = await prisma.morningSalary.findMany({ where });

  const totalPayroll = salaries.reduce((sum, s) => sum + parseFloat(s.totalSalary), 0);
  const generated = salaries.filter(s => s.status === 'GENERATED').length;
  const approved = salaries.filter(s => s.status === 'APPROVED').length;
  const paid = salaries.filter(s => s.status === 'PAID').length;
  const avgSalary = salaries.length > 0 ? Math.round(totalPayroll / salaries.length) : 0;

  res.json({
    statistics: { totalPayroll, totalRecords: salaries.length, generated, approved, paid, avgSalary },
  });
});

const getTeacherHistory = catchAsync(async (req, res) => {
  const { teacherId } = req.params;
  // Teachers may only view their own salary history
  if (req.user.role === 'TEACHER' && req.user.teacher?.id !== parseInt(teacherId)) {
    throw new AppError(403, { message: 'Access denied' });
  }
  const salaries = await prisma.morningSalary.findMany({
    where: { teacherId: parseInt(teacherId) },
    include: { teacher: true },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.json({ salaries });
});

const getById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const salary = await prisma.morningSalary.findUnique({
    where: { id },
    include: { teacher: true },
  });
  if (!salary) throw new AppError(404, 'Salary record not found');
  res.json({ salary });
});

const updateStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, remarks, paymentMethod } = req.body;

  if (!['APPROVED', 'PAID'].includes(status)) {
    throw new AppError(400, { message: 'Status must be APPROVED or PAID' });
  }

  const existing = await prisma.morningSalary.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Salary record not found');

  if (status === 'APPROVED' && existing.status !== 'GENERATED') {
    throw new AppError(400, { message: 'Can only approve GENERATED records' });
  }
  if (status === 'PAID' && existing.status !== 'APPROVED') {
    throw new AppError(400, { message: 'Can only mark APPROVED records as PAID' });
  }

  const salary = await prisma.morningSalary.update({
    where: { id },
    data: { status, remarks: remarks || existing.remarks },
    include: { teacher: true },
  });

  if (status === 'PAID') {
    await prisma.paymentHistory.create({
      data: {
        paymentType: 'MORNING_SALARY',
        morningSalaryId: id,
        amount: parseFloat(salary.totalSalary),
        paymentMethod: paymentMethod || 'CASH',
        previousBalance: parseFloat(salary.totalSalary),
        newBalance: 0,
        receivedBy: req.user.id, // PaymentHistory.receivedBy is a FK to User.id
      },
    });
  }

  res.json({ message: `Salary ${status.toLowerCase()} successfully`, salary });
});

const deleteSalary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.morningSalary.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Salary record not found');
  if (existing.status !== 'GENERATED') {
    throw new AppError(400, { message: 'Can only delete records with GENERATED status' });
  }
  await prisma.morningSalary.delete({ where: { id } });
  res.json({ message: 'Salary record deleted successfully' });
});

module.exports = {
  previewSalary, generateAll, generateSingle, getAll,
  getStatistics, getTeacherHistory, getById, updateStatus, deleteSalary,
};
