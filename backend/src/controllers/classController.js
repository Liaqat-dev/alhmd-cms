const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parseId } = require('../utils/helpers');
const { ACTIVE_ENROLLMENT } = require('../utils/enrollment');

// Typed-phrase confirmations. Both operations move every student in a class at
// once and neither has an undo button, so the client has to echo the word back.
const CONFIRM_PROMOTE = 'PROMOTE';
const CONFIRM_PASS_OUT = 'PASSOUT';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Aggregates unique teachers from a class's subjects
// subjects has teacherAssignments[].teacher
function collectTeachers(subjects) {
  const seen = new Set();
  const teachers = [];
  for (const subj of subjects) {
    for (const ta of subj.teacherAssignments || []) {
      if (ta.teacher && !seen.has(ta.teacher.id)) {
        seen.add(ta.teacher.id);
        teachers.push({ teacher: ta.teacher });
      }
    }
  }
  return teachers;
}

// Nested include for subjects → teacherAssignments → teacher
const subjectWithTeachers = {
  include: {
    teacherAssignments: {
      include: { teacher: { select: { id: true, name: true } } }
    }
  }
};

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /classes/all — returns every class with subjects. Used by AddStudent to
// populate the class picker.
const getAllClassesNoBatch = catchAsync(async (req, res) => {
  const classes = await prisma.class.findMany({
    include: {
      subjects: subjectWithTeachers,
      _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } }
    },
    orderBy: { name: 'asc' }
  });

  const mapped = classes.map(c => ({
    ...c,
    teachers: collectTeachers(c.subjects),
    _count: { students: c._count.enrollments, enrollments: c._count.enrollments }
  }));

  res.json({ classes: mapped });
});

// GET /classes — returns all classes
const getAllClasses = catchAsync(async (req, res) => {
  const { search, program } = req.query;

  const where = {};
  if (program) where.program = program;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const include = {
    subjects: subjectWithTeachers,
    _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } }
  };

  const classes = await prisma.class.findMany({ where, include, orderBy: { name: 'asc' } });

  const mapped = classes.map(c => ({
    ...c,
    teachers: collectTeachers(c.subjects),
    _count: { students: c._count.enrollments, enrollments: c._count.enrollments }
  }));

  res.json({ classes: mapped });
});

// GET /classes/:id
const getClassById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const include = {
    subjects: subjectWithTeachers,
    enrollments: {
      where: ACTIVE_ENROLLMENT,
      include: {
        student: { select: { id: true, name: true, rollNumber: true } }
      },
      orderBy: { student: { name: 'asc' } }
    },
    _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } }
  };

  const classData = await prisma.class.findUnique({ where: { id }, include });
  if (!classData) throw new AppError(404, 'Class not found');

  const students = classData.enrollments.map(e => e.student);
  const teachers = collectTeachers(classData.subjects);

  res.json({
    class: {
      ...classData,
        students,
      teachers,
      _count: { students: classData._count.enrollments, enrollments: classData._count.enrollments }
    }
  });
});

// POST /classes
const createClass = catchAsync(async (req, res) => {
  const { name, gradeLevel, program, studentLimit } = req.body;

  if (!name || !gradeLevel) {
    throw new AppError(400, { name: 'Name and grade level are required' });
  }

  // Subjects are managed on the Subjects page, not created here.
  const data = {
    name: name.trim(),
    gradeLevel,
    program: program || 'ICS',
    studentLimit: studentLimit ? parseInt(studentLimit) : 35
  };

  const include = {
    subjects: subjectWithTeachers,
    _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } }
  };

  const newClass = await prisma.class.create({ data, include });

  const response = {
    ...newClass,
    teachers: collectTeachers(newClass.subjects),
    _count: { students: newClass._count.enrollments, enrollments: newClass._count.enrollments }
  };

  res.status(201).json({ message: 'Class created successfully', class: response });
});

// PUT /classes/:id
const updateClass = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, gradeLevel, program, studentLimit } = req.body;

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Class not found');

  const data = {
    ...(name !== undefined && { name: name.trim() }),
    ...(gradeLevel !== undefined && { gradeLevel }),
    ...(program !== undefined && { program }),
    ...(studentLimit !== undefined && { studentLimit: parseInt(studentLimit) })
  };

  const include = {
    subjects: subjectWithTeachers,
    _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } }
  };

  const updatedClass = await prisma.class.update({ where: { id }, data, include });

  const response = {
    ...updatedClass,
    teachers: collectTeachers(updatedClass.subjects),
    _count: { students: updatedClass._count.enrollments, enrollments: updatedClass._count.enrollments }
  };

  res.json({ message: 'Class updated successfully', class: response });
});

// DELETE /classes/:id
const deleteClass = catchAsync(async (req, res) => {
  const { id } = req.params;

  const countResult = await prisma.class.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          enrollments: { where: ACTIVE_ENROLLMENT }
        }
      }
    }
  });
  if (!countResult) throw new AppError(404, 'Class not found');

  const activeStudents = countResult._count.enrollments || 0;

  if (activeStudents > 0) {
    throw new AppError(400, {
      message: 'Cannot delete class with enrolled students. Please remove or transfer students first.'
    });
  }

  await prisma.class.delete({ where: { id } });

  res.json({ message: 'Class deleted successfully' });
});

// POST /classes/:id/subjects
const addSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name) throw new AppError(400, { name: 'Subject name is required' });

  const existing = await prisma.class.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Class not found');

  const subject = await prisma.subject.create({
    data: { name: name.trim(), gradeLevel: existing.gradeLevel, classes: { connect: { id } } }
  });

  res.status(201).json({ message: 'Subject added successfully', subject });
});

// DELETE /classes/subjects/:subjectId
const removeSubject = catchAsync(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
  if (!subject) throw new AppError(404, 'Subject not found');

  await prisma.subject.delete({ where: { id: subjectId } });
  res.json({ message: 'Subject removed successfully' });
});

// ── Promotion & passing out ───────────────────────────────────────────────────
//
// A cohort moves through the school in one step: Grade 11 class → an empty
// Grade 12 class of the same program → passed out. Passing out a Grade 12 class
// empties it, which is what makes it available as a promotion target again.

// Loads a class along with its active-student count.
const findClassWithCount = (id) => prisma.class.findUnique({
  where: { id },
  include: { _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } } }
});

// GET /classes/:id/promotion-targets
// The Grade 12 classes a Grade 11 class may be promoted into: same program,
// and empty. The source count comes back too so the dialog can tell "nowhere
// to promote to" apart from "nobody to promote".
const getPromotionTargets = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);

  const sourceClass = await findClassWithCount(id);
  if (!sourceClass) throw new AppError(404, 'Class not found');

  if (sourceClass.gradeLevel !== 'GRADE_11') {
    throw new AppError(400, { message: 'Only a Grade 11 class can be promoted.' });
  }

  const candidates = await prisma.class.findMany({
    where: { gradeLevel: 'GRADE_12', program: sourceClass.program },
    include: { _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } } },
    orderBy: { name: 'asc' }
  });

  res.json({
    sourceClass: {
      id: sourceClass.id,
      name: sourceClass.name,
      program: sourceClass.program,
      studentCount: sourceClass._count.enrollments
    },
    // An occupied Grade 12 class is deliberately not offered — its students
    // have to be passed out first, which is the admin's cue to close them out.
    targets: candidates
      .filter(c => c._count.enrollments === 0)
      .map(c => ({ id: c.id, name: c.name, studentLimit: c.studentLimit })),
    occupiedCount: candidates.filter(c => c._count.enrollments > 0).length
  });
});

// POST /classes/:id/promote  { targetClassId, confirm: 'PROMOTE' }
// Moves every active enrollment across. Roll numbers, fees, challans, marks
// and attendance are all untouched — attendance rows carry their own classId,
// so the Grade 11 record stays attached to the Grade 11 class.
const promoteClass = catchAsync(async (req, res) => {
  const sourceId = parseId(req.params.id);
  const { targetClassId, confirm } = req.body;

  if (confirm !== CONFIRM_PROMOTE) {
    throw new AppError(400, { confirm: `Type ${CONFIRM_PROMOTE} to confirm this promotion.` });
  }

  const targetId = parseId(targetClassId);
  if (!targetId || Number.isNaN(targetId)) {
    throw new AppError(400, { targetClassId: 'Choose the Grade 12 class to promote into.' });
  }
  if (targetId === sourceId) {
    throw new AppError(400, { targetClassId: 'A class cannot be promoted into itself.' });
  }

  const [sourceClass, targetClass] = await Promise.all([
    findClassWithCount(sourceId),
    findClassWithCount(targetId)
  ]);

  if (!sourceClass) throw new AppError(404, 'Class not found');
  if (!targetClass) throw new AppError(404, { message: 'The selected Grade 12 class was not found.' });

  // Re-checked here rather than trusted from the dialog: the target could have
  // been filled by someone else between opening the dialog and confirming.
  if (sourceClass.gradeLevel !== 'GRADE_11') {
    throw new AppError(400, { message: 'Only a Grade 11 class can be promoted.' });
  }
  if (targetClass.gradeLevel !== 'GRADE_12') {
    throw new AppError(400, { targetClassId: `${targetClass.name} is not a Grade 12 class.` });
  }
  if (targetClass.program !== sourceClass.program) {
    throw new AppError(400, { targetClassId: `${targetClass.name} is a different program to ${sourceClass.name}.` });
  }
  if (targetClass._count.enrollments > 0) {
    throw new AppError(400, {
      targetClassId: `${targetClass.name} already has students. Pass that class out first to free it up.`
    });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: sourceId, ...ACTIVE_ENROLLMENT },
    select: { id: true, studentId: true }
  });

  if (enrollments.length === 0) {
    throw new AppError(400, { message: `${sourceClass.name} has no active students to promote.` });
  }

  const enrollmentIds = enrollments.map(e => e.id);
  const studentIds = enrollments.map(e => e.studentId);

  await prisma.$transaction([
    prisma.enrollment.updateMany({ where: { id: { in: enrollmentIds } }, data: { classId: targetId } }),
    // Subjects are per grade level, so a Grade 11 subject means nothing in a
    // Grade 12 class. They're cleared rather than guessed at — subjects are
    // assigned per student on the edit form once the cohort has moved.
    prisma.studentSubject.deleteMany({ where: { studentId: { in: studentIds } } })
  ]);

  const n = enrollments.length;

  res.json({
    message: `Promoted ${n} student${n === 1 ? '' : 's'} from ${sourceClass.name} to ${targetClass.name}. Their subjects need to be assigned again.`,
    promoted: n,
    targetClass: { id: targetClass.id, name: targetClass.name }
  });
});

// POST /classes/:id/pass-out  { confirm: 'PASSOUT' }
// Closes out a Grade 12 cohort. Every record is kept — this retires the
// enrollment and ends portal access, it does not delete anything.
const passOutClass = catchAsync(async (req, res) => {
  const id = parseId(req.params.id);
  const { confirm } = req.body;

  if (confirm !== CONFIRM_PASS_OUT) {
    throw new AppError(400, { confirm: `Type ${CONFIRM_PASS_OUT} to confirm passing this class out.` });
  }

  const classData = await prisma.class.findUnique({ where: { id } });
  if (!classData) throw new AppError(404, 'Class not found');

  if (classData.gradeLevel !== 'GRADE_12') {
    throw new AppError(400, { message: 'Only a Grade 12 class can be passed out.' });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: id, ...ACTIVE_ENROLLMENT },
    select: { id: true, studentId: true }
  });

  if (enrollments.length === 0) {
    throw new AppError(400, { message: `${classData.name} has no active students to pass out.` });
  }

  const enrollmentIds = enrollments.map(e => e.id);
  const studentIds = enrollments.map(e => e.studentId);

  // The same side effects as passing out one student from their profile:
  // status, retired enrollment, revoked sessions, dead reset links.
  await prisma.$transaction([
    prisma.student.updateMany({ where: { id: { in: studentIds } }, data: { status: 'PASSED_OUT' } }),
    prisma.enrollment.updateMany({ where: { id: { in: enrollmentIds } }, data: { isActive: false } }),
    prisma.refreshToken.updateMany({ where: { studentId: { in: studentIds }, isRevoked: false }, data: { isRevoked: true } }),
    prisma.passwordReset.deleteMany({ where: { studentId: { in: studentIds } } })
  ]);

  const n = enrollments.length;

  res.json({
    message: `Passed out ${n} student${n === 1 ? '' : 's'} from ${classData.name}. ${classData.name} is now free to receive a Grade 11 class.`,
    passedOut: n
  });
});

module.exports = {
  getAllClassesNoBatch,
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addSubject,
  removeSubject,
  getPromotionTargets,
  promoteClass,
  passOutClass
};
