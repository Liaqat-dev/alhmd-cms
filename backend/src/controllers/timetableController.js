const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Validation ────────────────────────────────────────────────────────────────
// Everything here runs before Prisma sees the payload. Without it a bad day
// name or a non-numeric id reaches the driver and comes back as the generic
// "Invalid data supplied to the database", which tells the user nothing about
// what they got wrong.

const DAY_VALUES = new Set(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAY_LABELS = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday', THURSDAY: 'Thursday',
  FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday'
};

// Ids arrive as strings from a <select>. Anything that isn't a whole number is
// rejected here rather than being handed to the database.
function requireId(value, field, label) {
  const id = parseInt(value, 10);
  if (!Number.isInteger(id) || String(id) !== String(value).trim()) {
    throw new AppError(400, { [field]: `Choose a ${label}.` });
  }
  return id;
}

// Day and times, including the ordering between them.
function assertSlotShape({ dayOfWeek, startTime, endTime }) {
  if (!DAY_VALUES.has(dayOfWeek)) {
    throw new AppError(400, { dayOfWeek: 'Choose a day of the week for this lecture.' });
  }
  if (!TIME_PATTERN.test(startTime)) {
    throw new AppError(400, { startTime: 'Start time must be a 24-hour time, like 09:00.' });
  }
  if (!TIME_PATTERN.test(endTime)) {
    throw new AppError(400, { endTime: 'End time must be a 24-hour time, like 10:00.' });
  }
  // "HH:MM" compares correctly as a string. Without this a lecture could be
  // saved running backwards, and every overlap test against it is meaningless.
  if (endTime === startTime) {
    throw new AppError(400, { endTime: 'The lecture needs to last longer than zero minutes.' });
  }
  if (endTime < startTime) {
    throw new AppError(400, { endTime: `A lecture cannot end at ${endTime} when it starts at ${startTime}.` });
  }
}

// Confirms the ids point at rows that exist, and that the subject is one the
// class actually takes — a foreign-key error otherwise surfaces as
// "Referenced record does not exist", which names nothing the user recognises.
async function assertRefsExist({ classId, subjectId, teacherId }) {
  const [cls, subject, teacher] = await Promise.all([
    classId == null ? null : prisma.class.findUnique({ where: { id: classId }, select: { id: true, name: true } }),
    subjectId == null ? null : prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, classes: { select: { id: true, name: true } } }
    }),
    teacherId == null ? null : prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true, name: true } })
  ]);

  if (classId != null && !cls) {
    throw new AppError(404, { classId: 'That class no longer exists. Refresh and try again.' });
  }
  if (subjectId != null && !subject) {
    throw new AppError(404, { subjectId: 'That subject no longer exists. Refresh and try again.' });
  }
  if (teacherId != null && !teacher) {
    throw new AppError(404, { teacherId: 'That teacher no longer exists. Refresh and try again.' });
  }

  if (cls && subject && !subject.classes.some(c => c.id === cls.id)) {
    throw new AppError(400, {
      subjectId: `${subject.name} is not taught in ${cls.name}. Pick a subject from that class.`
    });
  }

  return { cls, subject, teacher };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Returns Prisma OR conditions for time overlap detection
function timeOverlapCondition(startTime, endTime) {
  return {
    OR: [
      { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
      { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
      { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] }
    ]
  };
}

// Groups a flat timetable array by dayOfWeek
function groupByDay(entries) {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.dayOfWeek]) acc[entry.dayOfWeek] = [];
    acc[entry.dayOfWeek].push(entry);
    return acc;
  }, {});
}

// Checks if a teacher has a time clash in the timetable
// excludeId: entry id to exclude (for update operations)
async function checkTeacherClash(teacherId, dayOfWeek, startTime, endTime, excludeId = null) {
  const overlap = timeOverlapCondition(startTime, endTime);

  const conflict = await prisma.timetable.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      ...(excludeId && { id: { not: excludeId } }),
      ...overlap
    },
    include: { class: { select: { name: true } } }
  });

  if (conflict) {
    return `That teacher is already in ${conflict.class.name} on ${DAY_LABELS[dayOfWeek] || dayOfWeek} from ${conflict.startTime} to ${conflict.endTime}.`;
  }
  return null;
}

// Common include for timetable entry details
const entryInclude = {
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } }
};

// Normalizes an entry so UI gets consistent `class` field
function mapEntry(e) {
  const { class: cls, ...rest } = e;
  return { ...rest, class: cls, classId: e.classId };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /timetable/class/:classId
const getTimetableByClass = catchAsync(async (req, res) => {
  const { classId } = req.params;

  const rows = await prisma.timetable.findMany({
    where: { classId: classId },
    include: entryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/teacher — for teacher role: their schedule
const getTeacherTimetable = catchAsync(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  if (!teacherId) throw new AppError(400, { message: 'Teacher profile not found' });

  const rows = await prisma.timetable.findMany({
    where: { teacherId },
    include: entryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/teacher/:teacherId — admin view of a specific teacher's schedule
const getTimetableByTeacher = catchAsync(async (req, res) => {
  const { teacherId } = req.params;

  const rows = await prisma.timetable.findMany({
    where: { teacherId },
    include: entryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/student — for student role: their class schedule
const getStudentTimetable = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id;
  if (!studentId) throw new AppError(400, { message: 'Student profile not found' });

  const mainEnrollment = await prisma.enrollment.findUnique({
    where: { studentId },
    select: { classId: true }
  });

  if (!mainEnrollment?.classId) throw new AppError(400, { message: 'Student is not enrolled in any class' });

  const rows = await prisma.timetable.findMany({
    where: { classId: mainEnrollment.classId },
    include: entryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// POST /timetable
const createTimetableEntry = catchAsync(async (req, res) => {
  const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;

  if (!classId) throw new AppError(400, { classId: 'Choose the class this lecture belongs to.' });
  if (!subjectId) throw new AppError(400, { subjectId: 'Choose the subject being taught.' });

  const classIdNum = requireId(classId, 'classId', 'class');
  const subjectIdNum = requireId(subjectId, 'subjectId', 'subject');
  const teacherIdNum = teacherId == null || teacherId === '' ? null : requireId(teacherId, 'teacherId', 'teacher');

  assertSlotShape({ dayOfWeek, startTime, endTime });
  const { cls } = await assertRefsExist({ classId: classIdNum, subjectId: subjectIdNum, teacherId: teacherIdNum });

  const overlap = timeOverlapCondition(startTime, endTime);

  // 1. Check class time clash (same class, same day, overlapping time)
  const classClash = await prisma.timetable.findFirst({
    where: { classId: classIdNum, dayOfWeek, ...overlap },
    include: { subject: { select: { name: true } } }
  });
  if (classClash) {
    throw new AppError(409, {
      message: `${cls.name} already has ${classClash.subject.name} on ${DAY_LABELS[dayOfWeek]} from ${classClash.startTime} to ${classClash.endTime}.`
    });
  }

  // 2. Check teacher clash
  if (teacherIdNum) {
    const teacherClashMsg = await checkTeacherClash(teacherIdNum, dayOfWeek, startTime, endTime);
    if (teacherClashMsg) throw new AppError(409, { teacherId: teacherClashMsg });
  }

  const row = await prisma.timetable.create({
    data: {
      classId: classIdNum,
      subjectId: subjectIdNum,
      teacherId: teacherIdNum,
      dayOfWeek,
      startTime,
      endTime,
      room: room ? String(room).trim() || null : null
    },
    include: entryInclude
  });
  const entry = mapEntry(row);

  res.status(201).json({ message: 'Timetable entry created successfully', entry });
});

// PUT /timetable/:id
const updateTimetableEntry = catchAsync(async (req, res) => {
  const entryId = requireId(req.params.id, 'id', 'timetable entry');
  const { subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;

  const existingEntry = await prisma.timetable.findUnique({ where: { id: entryId } });
  if (!existingEntry) throw new AppError(404, 'Timetable entry not found');

  // Only the fields actually sent change; the rest keep what is on record.
  const updatedDay = dayOfWeek || existingEntry.dayOfWeek;
  const updatedStart = startTime || existingEntry.startTime;
  const updatedEnd = endTime || existingEntry.endTime;

  const updatedSubjectId = subjectId === undefined
    ? existingEntry.subjectId
    : requireId(subjectId, 'subjectId', 'subject');

  const clearingTeacher = teacherId === null || teacherId === '' || teacherId === 'none';
  const updatedTeacherId = teacherId === undefined
    ? existingEntry.teacherId
    : (clearingTeacher ? null : requireId(teacherId, 'teacherId', 'teacher'));

  // Validated against the merged result, not just the fields that were sent —
  // moving only the end time can still put a lecture before its own start.
  assertSlotShape({ dayOfWeek: updatedDay, startTime: updatedStart, endTime: updatedEnd });
  const { cls } = await assertRefsExist({
    classId: existingEntry.classId,
    subjectId: updatedSubjectId,
    teacherId: updatedTeacherId
  });

  const overlap = timeOverlapCondition(updatedStart, updatedEnd);

  // 1. Check class time clash (excluding this entry)
  const classClash = await prisma.timetable.findFirst({
    where: { classId: existingEntry.classId, dayOfWeek: updatedDay, id: { not: entryId }, ...overlap },
    include: { subject: { select: { name: true } } }
  });
  if (classClash) {
    throw new AppError(409, {
      message: `${cls.name} already has ${classClash.subject.name} on ${DAY_LABELS[updatedDay]} from ${classClash.startTime} to ${classClash.endTime}.`
    });
  }

  // 2. Check teacher clash (excluding this entry)
  if (updatedTeacherId) {
    const teacherClashMsg = await checkTeacherClash(updatedTeacherId, updatedDay, updatedStart, updatedEnd, entryId);
    if (teacherClashMsg) throw new AppError(409, { teacherId: teacherClashMsg });
  }

  const row = await prisma.timetable.update({
    where: { id: entryId },
    data: {
      subjectId: updatedSubjectId,
      teacherId: updatedTeacherId,
      dayOfWeek: updatedDay,
      startTime: updatedStart,
      endTime: updatedEnd,
      ...(room !== undefined && { room: room ? String(room).trim() || null : null })
    },
    include: entryInclude
  });
  const entry = mapEntry(row);

  res.json({ message: 'Timetable entry updated successfully', entry });
});

// DELETE /timetable/:id
const deleteTimetableEntry = catchAsync(async (req, res) => {
  const id = requireId(req.params.id, 'id', 'timetable entry');

  const existing = await prisma.timetable.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Timetable entry not found');
  await prisma.timetable.delete({ where: { id } });

  res.json({ message: 'Timetable entry deleted successfully' });
});

// DELETE /timetable/class/:classId/clear
const clearClassTimetable = catchAsync(async (req, res) => {
  const { classId } = req.params;

  await prisma.timetable.deleteMany({ where: { classId: classId } });

  res.json({ message: 'Timetable cleared successfully' });
});

module.exports = {
  getTimetableByClass,
  getTimetableByTeacher,
  getTeacherTimetable,
  getStudentTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  clearClassTimetable
};
