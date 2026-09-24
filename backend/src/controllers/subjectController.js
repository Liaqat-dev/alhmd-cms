const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Helpers ───────────────────────────────────────────────────────────────────

const classSelect = {
  id: true, name: true, gradeLevel: true,
  _count: { select: { enrollments: true } }
};

// Maps a Subject row (with `classes` included) to the UI-expected shape.
//
// A subject is meant to have one teacher — teacherController rejects assigning
// one that already belongs to somebody else. Older rows can still carry
// several, so `teachers` is the honest list and `teacherId` is filled only
// when there is exactly one, which is what lets the timetable auto-fill.
function mapSubjectRow(s) {
  const classes = (s.classes || []).map(c => ({ id: c.id, name: c.name, gradeLevel: c.gradeLevel }));
  const teachers = (s.teacherAssignments || [])
    .map(ta => ta.teacher)
    .filter(Boolean);

  const { teacherAssignments: _assignments, ...rest } = s;

  return {
    ...rest,
    classIds: classes.map(c => c.id),
    classes,
    teachers,
    teacherId: teachers.length === 1 ? teachers[0].id : null,
    // Student count = sum of active enrollments across every class this subject is taught in
    _count: { students: (s.classes || []).reduce((sum, c) => sum + (c._count?.enrollments ?? 0), 0) }
  };
}

const teacherInclude = {
  teacherAssignments: {
    include: { teacher: { select: { id: true, name: true } } },
    orderBy: { assignedAt: 'asc' }
  }
};

// Replaces whichever teachers a subject has with the one given, or clears it.
// Writing the whole set is what keeps the one-teacher rule true going forward,
// including for an older row that had picked up several.
async function setSubjectTeacher(subjectId, teacherId) {
  if (teacherId != null) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true } });
    if (!teacher) throw new AppError(404, { teacherId: 'That teacher no longer exists. Refresh and try again.' });
  }

  await prisma.$transaction([
    prisma.subjectTeacher.deleteMany({ where: { subjectId } }),
    ...(teacherId != null
      ? [prisma.subjectTeacher.create({ data: { subjectId, teacherId } })]
      : [])
  ]);
}

// Normalises the teacherId a client sent: undefined means "leave alone",
// anything empty means "no teacher".
function readTeacherId(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '' || value === 'none') return null;
  const id = parseInt(value, 10);
  if (!Number.isInteger(id)) throw new AppError(400, { teacherId: 'Choose a teacher.' });
  return id;
}

const GRADE_LEVEL_LABELS = { GRADE_11: 'Grade 11', GRADE_12: 'Grade 12' };

// Validates that every classId belongs to the given gradeLevel. Throws on mismatch.
async function validateClassesForGradeLevel(classIds, gradeLevel) {
  if (!classIds || classIds.length === 0) return;
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    select: { id: true, gradeLevel: true }
  });
  if (classes.length !== classIds.length) {
    throw new AppError(400, { classIds: 'One or more selected classes were not found' });
  }
  const mismatched = classes.find(c => c.gradeLevel !== gradeLevel);
  if (mismatched) {
    throw new AppError(400, { classIds: `All selected classes must be ${GRADE_LEVEL_LABELS[gradeLevel] || gradeLevel}` });
  }
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /subjects
const getAllSubjects = catchAsync(async (req, res) => {
  const { classId, gradeLevel } = req.query;

  const where = {};
  if (classId) where.classes = { some: { id: classId } };
  if (gradeLevel) where.gradeLevel = gradeLevel;

  const rows = await prisma.subject.findMany({
    where,
    include: { classes: { select: classSelect }, ...teacherInclude },
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }]
  });
  const subjects = rows.map(mapSubjectRow);

  res.json({ subjects });
});

// GET /subjects/:id
const getSubjectById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const row = await prisma.subject.findUnique({
    where: { id },
    include: { classes: { select: classSelect }, ...teacherInclude }
  });
  if (!row) throw new AppError(404, 'Subject not found');

  res.json({ subject: mapSubjectRow(row) });
});

// POST /subjects
const createSubject = catchAsync(async (req, res) => {
  const { name, gradeLevel, classIds = [], teacherId } = req.body;
  const wantedTeacherId = readTeacherId(teacherId);

  if (!name || !gradeLevel) {
    throw new AppError(400, { message: 'Name and grade level are required' });
  }

  const ids = Array.isArray(classIds) ? [...new Set(classIds.filter(Boolean))] : [];
  await validateClassesForGradeLevel(ids, gradeLevel);

  // Check for duplicate (subject names are unique per grade level)
  const existing = await prisma.subject.findFirst({
    where: { name: { equals: name, mode: 'insensitive' }, gradeLevel }
  });
  if (existing) throw new AppError(409, { name: 'A subject with this name already exists for this grade level' });

  const created = await prisma.subject.create({
    data: {
      name: name.trim(),
      gradeLevel,
      ...(ids.length > 0 && { classes: { connect: ids.map(id => ({ id })) } })
    },
    select: { id: true }
  });

  if (wantedTeacherId !== undefined) {
    await setSubjectTeacher(created.id, wantedTeacherId);
  }

  const row = await prisma.subject.findUnique({
    where: { id: created.id },
    include: { classes: { select: classSelect }, ...teacherInclude }
  });

  res.status(201).json({ message: 'Subject created successfully', subject: mapSubjectRow(row) });
});

// PUT /subjects/:id
const updateSubject = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, gradeLevel, classIds, teacherId } = req.body;
  const wantedTeacherId = readTeacherId(teacherId);

  const existing = await prisma.subject.findUnique({
    where: { id },
    include: { classes: { select: { id: true } } }
  });
  if (!existing) throw new AppError(404, 'Subject not found');

  const finalGradeLevel = gradeLevel !== undefined ? gradeLevel : existing.gradeLevel;
  const finalClassIds = Array.isArray(classIds)
    ? [...new Set(classIds.filter(Boolean))]
    : existing.classes.map(c => c.id);

  await validateClassesForGradeLevel(finalClassIds, finalGradeLevel);

  if (name !== undefined) {
    const dup = await prisma.subject.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, gradeLevel: finalGradeLevel, NOT: { id } }
    });
    if (dup) throw new AppError(409, { name: 'A subject with this name already exists for this grade level' });
  }

  await prisma.subject.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(gradeLevel !== undefined && { gradeLevel }),
      ...(classIds !== undefined && { classes: { set: finalClassIds.map(cid => ({ id: cid })) } })
    },
    select: { id: true }
  });

  if (wantedTeacherId !== undefined) {
    await setSubjectTeacher(existing.id, wantedTeacherId);
  }

  const row = await prisma.subject.findUnique({
    where: { id },
    include: { classes: { select: classSelect }, ...teacherInclude }
  });

  res.json({ message: 'Subject updated successfully', subject: mapSubjectRow(row) });
});

// DELETE /subjects/:id
const deleteSubject = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.subject.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Subject not found');

  await prisma.subject.delete({ where: { id } });

  res.json({ message: 'Subject deleted successfully' });
});

// POST /subjects/bulk — bulk-add a set of subject names to one class (used when
// setting up a brand-new class). Reuses an existing same-grade-level subject by
// name if one exists instead of creating a duplicate.
const bulkCreateSubjects = catchAsync(async (req, res) => {
  const { classId, subjects } = req.body;

  if (!classId || !Array.isArray(subjects) || subjects.length === 0) {
    throw new AppError(400, { message: 'Class ID and subjects array are required' });
  }

  const cls = await prisma.class.findUnique({ where: { id: classId }, select: { id: true, gradeLevel: true } });
  if (!cls) throw new AppError(400, { classId: 'Class not found' });

  const names = [...new Set(subjects.map(s => s.trim()).filter(Boolean))];

  let count = 0;
  for (const name of names) {
    const existing = await prisma.subject.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, gradeLevel: cls.gradeLevel }
    });
    if (existing) {
      await prisma.subject.update({
        where: { id: existing.id },
        data: { classes: { connect: { id: classId } } }
      });
    } else {
      await prisma.subject.create({
        data: { name, gradeLevel: cls.gradeLevel, classes: { connect: { id: classId } } }
      });
    }
    count++;
  }

  res.status(201).json({
    message: `${count} subjects processed successfully`,
    count
  });
});

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  bulkCreateSubjects
};
