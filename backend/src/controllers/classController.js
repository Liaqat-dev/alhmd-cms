const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

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
      _count: { select: { enrollments: { where: { isActive: true } } } }
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
    _count: { select: { enrollments: { where: { isActive: true } } } }
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
      where: { isActive: true },
      include: {
        student: { select: { id: true, name: true, rollNumber: true } }
      },
      orderBy: { student: { name: 'asc' } }
    },
    _count: { select: { enrollments: { where: { isActive: true } } } }
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
    _count: { select: { enrollments: { where: { isActive: true } } } }
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
    _count: { select: { enrollments: { where: { isActive: true } } } }
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
          enrollments: { where: { isActive: true } }
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

module.exports = {
  getAllClassesNoBatch,
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addSubject,
  removeSubject
};
