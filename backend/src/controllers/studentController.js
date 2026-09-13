const bcrypt = require('bcryptjs');
const { generateRollNumber } = require('../utils/helpers');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getAllStudents = catchAsync(async (req, res) => {
  const { classId, search, status, academicYear, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const where = {};
  const conditions = [];

  if (status) where.status = status;
  if (academicYear) where.academicYear = academicYear;

  if (search) {
    conditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } }
      ]
    });
  }

  if (classId) {
    conditions.push({ morningEnrollment: { morningClassId: classId } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        morningEnrollment: { include: { morningClass: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.student.count({ where })
  ]);

  const mapped = students.map(s => {
    const { password: _pw, ...rest } = s;
    const primaryClass = s.morningEnrollment?.morningClass || null;
    return { ...rest, class: primaryClass };
  });

  res.json({ students: mapped, total, page: pageNum, limit: limitNum });
});

const getStudentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInt(id, 10);

  // Students can only access their own profile
  if (req.user.role === 'STUDENT' && req.user.student?.id !== studentId) {
    throw new AppError(403, 'Access denied. You can only access your own profile.');
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      morningEnrollment: { include: { morningClass: { select: { id: true, name: true } } } },
      morningSubjects: { include: { subject: { select: { classes: { select: { id: true } } } } } }
    }
  });

  if (!student) throw new AppError(404, 'Student not found');

  // Morning regular enrollment
  const morningRegularClassId = student.morningEnrollment?.morningClassId || null;
  const morningRegularSubjectEnrollments = student.morningEnrollment
    ? student.morningSubjects
        .filter(ms => ms.subject.classes.some(c => c.id === student.morningEnrollment.morningClassId))
        .map(ms => ({ subjectId: ms.subjectId }))
    : [];

  const { password: _pw, ...studentWithoutPassword } = student;

  const responseStudent = {
    ...studentWithoutPassword,
    morningRegularClassId,
    morningRegularSubjectEnrollments,
    monthlyFee: student.morningEnrollment?.monthlyFee ?? null
  };

  res.json({ student: responseStudent });
});

const createStudent = catchAsync(async (req, res) => {
  const {
    name, fatherName, dateOfBirth, gender, cnic, address, phone, guardianPhone, schoolName,
    morningRegularClassId, morningRegularSubjectEnrollments = [],
    monthlyFee, registrationFee,
    joiningDate, academicYear, status, password, email, rollNumber: customRollNumber,
  } = req.body;

  if (!name || !fatherName || !dateOfBirth || !gender || !address || !guardianPhone || !joiningDate) {
    throw new AppError(400, { message: 'Required fields are missing.' });
  }

  const morningClassId = morningRegularClassId || null;

  if (!morningClassId) {
    throw new AppError(400, { message: 'A class must be selected.' });
  }

  // Morning subject data (no per-subject fee for morning)
  const allMorningSubjectsData = morningRegularSubjectEnrollments.map(se => ({
    subjectId: se.subjectId,
  }));

  // Use custom roll number if provided, otherwise auto-generate
  const rollNumber = customRollNumber || (await generateRollNumber(prisma));
  const studentPassword = password || rollNumber;
  const hashedPassword = await bcrypt.hash(studentPassword, 10);

  const student = await prisma.student.create({
    data: {
      rollNumber,
      password: hashedPassword,
      email: email || null,
      name, fatherName,
      dateOfBirth: new Date(dateOfBirth),
      gender, cnic, address, phone, guardianPhone, schoolName,
      registrationFee: registrationFee ? parseFloat(registrationFee) : null,
      joiningDate: new Date(joiningDate),
      academicYear: academicYear || '2025-2026',
      status: status || 'ENROLLED',
      ...(morningClassId && {
        morningEnrollment: {
          create: { morningClassId: morningClassId, monthlyFee: monthlyFee ? parseFloat(monthlyFee) : 0 }
        }
      }),
      ...(allMorningSubjectsData.length > 0 && {
        morningSubjects: { createMany: { data: allMorningSubjectsData, skipDuplicates: true } }
      }),
    },
    include: {
      morningEnrollment: { include: { morningClass: true } }
    }
  });

  const { password: _pw, ...studentWithoutPassword } = student;

  res.status(201).json({
    message: 'Student created successfully',
    student: studentWithoutPassword,
    rollNumber,
    defaultPassword: studentPassword
  });
});

const updateStudent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInt(id, 10); // ensure Int for Prisma data payloads
  const {
    name, fatherName, dateOfBirth, gender, cnic, address, phone, guardianPhone, schoolName,
    morningRegularClassId, morningRegularSubjectEnrollments,
    monthlyFee, registrationFee,
    joiningDate, academicYear, status, rollNumber, password, email
  } = req.body;

  const existingStudent = await prisma.student.findUnique({ where: { id: studentId } });
  if (!existingStudent) throw new AppError(404, 'Student not found');

  const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

  // Update personal info (+ password/email if provided)
  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      name, fatherName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender, cnic, address, phone, guardianPhone, schoolName,
      registrationFee: registrationFee !== undefined
        ? (registrationFee != null && registrationFee !== '' ? parseFloat(registrationFee) : null)
        : undefined,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      ...(academicYear !== undefined && { academicYear }),
      ...(status !== undefined && { status }),
      ...(rollNumber !== undefined && { rollNumber }),
      ...(email !== undefined && { email: email || null }),
      ...(hashedPassword && { password: hashedPassword }),
    }
  });

  const { password: _pw, ...studentWithoutPassword } = student;

  // Rebuild enrollment if any class-related field was sent
  if (morningRegularClassId !== undefined) {
    const morningClassId = morningRegularClassId ? parseInt(morningRegularClassId, 10) : null;

    const morningSubs = morningRegularSubjectEnrollments || [];
    // Morning has no per-subject fee — just track subject enrollment
    const allMorningSubjectsData = morningClassId ? morningSubs.map(se => ({
      studentId, subjectId: parseInt(se.subjectId, 10),
    })) : [];

    // Delete all existing subject enrollments
    await prisma.morningStudentSubject.deleteMany({ where: { studentId } });

    // Rebuild morning enrollment
    if (morningClassId) {
      await prisma.morningEnrollment.upsert({
        where: { studentId },
        update: { morningClassId, isActive: true, ...(monthlyFee != null && monthlyFee !== '' ? { monthlyFee: parseFloat(monthlyFee) } : {}) },
        create: { studentId, morningClassId, monthlyFee: monthlyFee != null && monthlyFee !== '' ? parseFloat(monthlyFee) : 0 }
      });
    } else {
      await prisma.morningEnrollment.updateMany({ where: { studentId }, data: { isActive: false } });
    }

    // Recreate subjects
    if (allMorningSubjectsData.length > 0) {
      await prisma.morningStudentSubject.createMany({ data: allMorningSubjectsData, skipDuplicates: true });
    }
  } else if (monthlyFee != null && monthlyFee !== '') {
    // Only fee update
    await prisma.morningEnrollment.updateMany({
      where: { studentId, isActive: true },
      data: { monthlyFee: parseFloat(monthlyFee) }
    });
  }

  res.json({ message: 'Student updated successfully', student: studentWithoutPassword });
});

const deleteStudent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInt(id, 10);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError(404, 'Student not found');

  await prisma.student.delete({ where: { id: studentId } });

  res.json({ message: 'Student deleted successfully' });
});

const getStudentsByClass = catchAsync(async (req, res) => {
  const { classId } = req.params;

  const enrollments = await prisma.morningEnrollment.findMany({
    where: { morningClassId: classId, isActive: true },
    include: { student: true },
    orderBy: { student: { name: 'asc' } }
  });

  const students = enrollments.map(e => {
    const { password: _pw, ...rest } = e.student;
    return rest;
  });

  res.json({ students });
});

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass
};
