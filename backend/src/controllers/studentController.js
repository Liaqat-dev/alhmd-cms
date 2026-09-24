const bcrypt = require('bcryptjs');
const { generateRollNumber, peekRollNumber, parseId } = require('../utils/helpers');
const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Degree hand-over only applies to a student who has passed out, and the date
// and recipient only apply once the degree is actually marked as received.
// Anything else is dropped rather than stored, so the record can't end up
// claiming an enrolled student collected a degree on some date.
const normaliseDegreeFields = ({ status, degreeReceived, degreeReceivedAt, degreeReceivedBy }) => {
  if (status !== 'PASSED_OUT') return {};
  // Absent means "not part of this update" — a partial save from elsewhere
  // must not silently un-receive a degree that was already recorded.
  if (degreeReceived === undefined) return {};

  const received = degreeReceived === true || degreeReceived === 'true';
  if (!received) {
    return { degreeReceived: false, degreeReceivedAt: null, degreeReceivedBy: null };
  }

  return {
    degreeReceived: true,
    degreeReceivedAt: degreeReceivedAt ? new Date(degreeReceivedAt) : null,
    degreeReceivedBy: degreeReceivedBy ? String(degreeReceivedBy).trim() || null : null
  };
};

// An admin may override the generated roll number; it still has to be free.
const claimCustomRollNumber = async (value) => {
  const rollNumber = String(value).trim();

  const taken = await prisma.student.findUnique({
    where: { rollNumber },
    select: { id: true }
  });

  if (taken) {
    throw new AppError(409, { message: `Roll number ${rollNumber} is already assigned to another student.` });
  }

  return rollNumber;
};

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
    conditions.push({ enrollment: { classId: classId } });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: {
        enrollment: { include: { class: { select: { id: true, name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.student.count({ where })
  ]);

  const mapped = students.map(s => {
    const { password: _pw, ...rest } = s;
    const primaryClass = s.enrollment?.class || null;
    return { ...rest, class: primaryClass };
  });

  res.json({ students: mapped, total, page: pageNum, limit: limitNum });
});

const getStudentById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const studentId = parseInt(id, 10);

  // Ownership (a student viewing their own profile) vs. students.view
  // permission is already enforced by the allowSelfOrPermission route
  // middleware — see routes/students.js.

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollment: { include: { class: { select: { id: true, name: true } } } },
      subjects: { include: { subject: { select: { classes: { select: { id: true } } } } } }
    }
  });

  if (!student) throw new AppError(404, 'Student not found');

  // Regular class enrollment
  const regularClassId = student.enrollment?.classId || null;
  const regularSubjectEnrollments = student.enrollment
    ? student.subjects
        .filter(ms => ms.subject.classes.some(c => c.id === student.enrollment.classId))
        .map(ms => ({ subjectId: ms.subjectId }))
    : [];

  const { password: _pw, ...studentWithoutPassword } = student;

  const responseStudent = {
    ...studentWithoutPassword,
    regularClassId,
    regularSubjectEnrollments,
    monthlyFee: student.enrollment?.monthlyFee ?? null
  };

  res.json({ student: responseStudent });
});

// Preview of the roll number the next student in this class would get.
// It does not reserve anything, so the number shown can change if someone
// else is admitted first — the form treats it as a hint, not a claim.
const previewRollNumber = catchAsync(async (req, res) => {
  const { classId, academicYear, joiningDate } = req.query;

  const studentClass = classId
    ? await prisma.class.findUnique({ where: { id: parseId(classId) }, select: { program: true } })
    : null;

  if (!studentClass) {
    throw new AppError(400, { message: 'A valid class must be selected.' });
  }

  const rollNumber = await peekRollNumber(prisma, {
    program: studentClass.program,
    academicYear,
    joiningDate
  });

  res.json({ rollNumber, program: studentClass.program });
});

const createStudent = catchAsync(async (req, res) => {
  const {
    name, fatherName, dateOfBirth, gender, cnic, address, phone, guardianPhone, schoolName,
    regularClassId, regularSubjectEnrollments = [],
    monthlyFee, registrationFee,
    joiningDate, academicYear, status, password, email, rollNumber: customRollNumber,
  } = req.body;

  if (!name || !fatherName || !dateOfBirth || !gender || !address || !guardianPhone || !joiningDate) {
    throw new AppError(400, { message: 'Required fields are missing.' });
  }

  const classId = regularClassId || null;

  if (!classId) {
    throw new AppError(400, { message: 'A class must be selected.' });
  }

  // The class decides the program prefix of the roll number.
  const studentClass = await prisma.class.findUnique({
    where: { id: parseId(classId) },
    select: { program: true }
  });

  if (!studentClass) {
    throw new AppError(400, { message: 'The selected class was not found.' });
  }

  // Subject data (no per-subject fee)
  const allSubjectsData = regularSubjectEnrollments.map(se => ({
    subjectId: se.subjectId,
  }));

  // Use custom roll number if provided, otherwise auto-generate
  const rollNumber = customRollNumber?.trim()
    ? await claimCustomRollNumber(customRollNumber)
    : await generateRollNumber(prisma, {
      program: studentClass.program,
      academicYear,
      joiningDate
    });
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
      ...normaliseDegreeFields({ ...req.body, status: status || 'ENROLLED' }),
      ...(classId && {
        enrollment: {
          create: {
            classId: classId,
            monthlyFee: monthlyFee ? parseFloat(monthlyFee) : 0,
            // Backfilling an already-passed-out student keeps the class on
            // record without counting them as an active enrollment.
            isActive: status !== 'PASSED_OUT'
          }
        }
      }),
      ...(allSubjectsData.length > 0 && {
        subjects: { createMany: { data: allSubjectsData, skipDuplicates: true } }
      }),
    },
    include: {
      enrollment: { include: { class: true } }
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
    regularClassId, regularSubjectEnrollments,
    monthlyFee, registrationFee,
    joiningDate, academicYear, status, rollNumber, password, email
  } = req.body;

  const existingStudent = await prisma.student.findUnique({ where: { id: studentId } });
  if (!existingStudent) throw new AppError(404, 'Student not found');

  // A roll number is permanent once issued — attendance, challans, documents
  // and the student's own login all hang off it. Resending the current value
  // is fine; changing it is not.
  if (rollNumber !== undefined && String(rollNumber).trim() !== existingStudent.rollNumber) {
    throw new AppError(400, { message: 'Roll number cannot be changed once the student has been created.' });
  }

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
      // Keyed off the status being saved now, not the one on record — the two
      // arrive in the same request when an admin passes a student out.
      ...normaliseDegreeFields({ ...req.body, status: status !== undefined ? status : existingStudent.status }),
      ...(email !== undefined && { email: email || null }),
      ...(hashedPassword && { password: hashedPassword }),
    }
  });

  const { password: _pw, ...studentWithoutPassword } = student;

  // Rebuild enrollment if any class-related field was sent
  if (regularClassId !== undefined) {
    const classId = regularClassId ? parseInt(regularClassId, 10) : null;

    const subs = regularSubjectEnrollments || [];
    // No per-subject fee — just track subject enrollment
    const allSubjectsData = classId ? subs.map(se => ({
      studentId, subjectId: parseInt(se.subjectId, 10),
    })) : [];

    // Delete all existing subject enrollments
    await prisma.studentSubject.deleteMany({ where: { studentId } });

    // Rebuild enrollment
    if (classId) {
      await prisma.enrollment.upsert({
        where: { studentId },
        update: { classId, isActive: true, ...(monthlyFee != null && monthlyFee !== '' ? { monthlyFee: parseFloat(monthlyFee) } : {}) },
        create: { studentId, classId, monthlyFee: monthlyFee != null && monthlyFee !== '' ? parseFloat(monthlyFee) : 0 }
      });
    } else {
      await prisma.enrollment.updateMany({ where: { studentId }, data: { isActive: false } });
    }

    // Recreate subjects
    if (allSubjectsData.length > 0) {
      await prisma.studentSubject.createMany({ data: allSubjectsData, skipDuplicates: true });
    }
  } else if (monthlyFee != null && monthlyFee !== '') {
    // Only fee update
    await prisma.enrollment.updateMany({
      where: { studentId, isActive: true },
      data: { monthlyFee: parseFloat(monthlyFee) }
    });
  }

  // Passing out keeps every record — enrollment, attendance, challans, marks —
  // but retires the enrollment so the student stops counting as active, and
  // cuts off portal access straight away. Runs last so the enrollment rebuild
  // above can't re-activate them. Reverting the status brings them back.
  if (status !== undefined && status !== existingStudent.status) {
    if (status === 'PASSED_OUT') {
      await prisma.$transaction([
        prisma.enrollment.updateMany({ where: { studentId }, data: { isActive: false } }),
        prisma.refreshToken.updateMany({ where: { studentId, isRevoked: false }, data: { isRevoked: true } }),
        prisma.passwordReset.deleteMany({ where: { studentId } })
      ]);
    } else if (existingStudent.status === 'PASSED_OUT') {
      // Reverting restores the enrollment, but only if it still has a
      // class — a class-less enrollment is deliberately inactive.
      await prisma.enrollment.updateMany({
        where: { studentId, classId: { not: null } },
        data: { isActive: true }
      });
    }
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

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: classId, isActive: true },
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
  previewRollNumber,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass
};
