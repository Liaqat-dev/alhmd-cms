const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

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

  const conflict = await prisma.morningTimetable.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      ...(excludeId && { id: { not: excludeId } }),
      ...overlap
    },
    include: { morningClass: { select: { name: true } } }
  });

  if (conflict) {
    return `Teacher is already scheduled in ${conflict.morningClass.name} on ${dayOfWeek} from ${conflict.startTime} to ${conflict.endTime}`;
  }
  return null;
}

// Common include for timetable entry details
const morningEntryInclude = {
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, name: true } },
  morningClass: { select: { id: true, name: true } }
};

// Normalizes a morning entry so UI gets consistent `class` field
function mapMorningEntry(e) {
  const { morningClass, ...rest } = e;
  return { ...rest, class: morningClass, classId: e.morningClassId };
}

// ── Controllers ───────────────────────────────────────────────────────────────

// GET /timetable/class/:classId
const getTimetableByClass = catchAsync(async (req, res) => {
  const { classId } = req.params;

  const rows = await prisma.morningTimetable.findMany({
    where: { morningClassId: classId },
    include: morningEntryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapMorningEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/teacher — for teacher role: their schedule
const getTeacherTimetable = catchAsync(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  if (!teacherId) throw new AppError(400, { message: 'Teacher profile not found' });

  const rows = await prisma.morningTimetable.findMany({
    where: { teacherId },
    include: morningEntryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapMorningEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/teacher/:teacherId — admin view of a specific teacher's schedule
const getTimetableByTeacher = catchAsync(async (req, res) => {
  const { teacherId } = req.params;

  const rows = await prisma.morningTimetable.findMany({
    where: { teacherId },
    include: morningEntryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapMorningEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// GET /timetable/student — for student role: their class schedule
const getStudentTimetable = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id;
  if (!studentId) throw new AppError(400, { message: 'Student profile not found' });

  const mainEnrollment = await prisma.morningEnrollment.findUnique({
    where: { studentId },
    select: { morningClassId: true }
  });

  if (!mainEnrollment?.morningClassId) throw new AppError(400, { message: 'Student is not enrolled in any class' });

  const rows = await prisma.morningTimetable.findMany({
    where: { morningClassId: mainEnrollment.morningClassId },
    include: morningEntryInclude,
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
  const entries = rows.map(mapMorningEntry);

  res.json({ timetable: groupByDay(entries), entries });
});

// POST /timetable
const createTimetableEntry = catchAsync(async (req, res) => {
  const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;

  if (!classId || !subjectId || !dayOfWeek || !startTime || !endTime) {
    throw new AppError(400, { message: 'Class, subject, day, start time, and end time are required' });
  }

  const overlap = timeOverlapCondition(startTime, endTime);

  // 1. Check class time clash (same class, same day, overlapping time)
  const classClash = await prisma.morningTimetable.findFirst({
    where: { morningClassId: classId, dayOfWeek, ...overlap }
  });
  if (classClash) {
    throw new AppError(409, {
      message: `This class already has a slot on ${dayOfWeek} from ${classClash.startTime} to ${classClash.endTime}`
    });
  }

  // 2. Check teacher clash
  if (teacherId) {
    const teacherClashMsg = await checkTeacherClash(teacherId, dayOfWeek, startTime, endTime);
    if (teacherClashMsg) throw new AppError(409, { message: teacherClashMsg });
  }

  const row = await prisma.morningTimetable.create({
    data: { morningClassId: classId, subjectId, teacherId: teacherId || null, dayOfWeek, startTime, endTime, room: room || null },
    include: morningEntryInclude
  });
  const entry = mapMorningEntry(row);

  res.status(201).json({ message: 'Timetable entry created successfully', entry });
});

// PUT /timetable/:id
const updateTimetableEntry = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { subjectId, teacherId, dayOfWeek, startTime, endTime, room } = req.body;

  const existingEntry = await prisma.morningTimetable.findUnique({ where: { id } });
  if (!existingEntry) throw new AppError(404, 'Timetable entry not found');

  const updatedDay = dayOfWeek || existingEntry.dayOfWeek;
  const updatedStart = startTime || existingEntry.startTime;
  const updatedEnd = endTime || existingEntry.endTime;
  const updatedTeacherId = teacherId !== undefined ? teacherId : existingEntry.teacherId;

  const overlap = timeOverlapCondition(updatedStart, updatedEnd);

  // 1. Check class time clash (excluding this entry)
  const classClash = await prisma.morningTimetable.findFirst({
    where: { morningClassId: existingEntry.morningClassId, dayOfWeek: updatedDay, id: { not: id }, ...overlap }
  });
  if (classClash) {
    throw new AppError(409, {
      message: `This class already has a slot on ${updatedDay} from ${classClash.startTime} to ${classClash.endTime}`
    });
  }

  // 2. Check teacher clash (excluding this entry)
  if (updatedTeacherId) {
    const teacherClashMsg = await checkTeacherClash(updatedTeacherId, updatedDay, updatedStart, updatedEnd, id);
    if (teacherClashMsg) throw new AppError(409, { message: teacherClashMsg });
  }

  const row = await prisma.morningTimetable.update({
    where: { id },
    data: {
      ...(subjectId !== undefined && { subjectId }),
      ...(teacherId !== undefined && { teacherId: teacherId || null }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(startTime !== undefined && { startTime }),
      ...(endTime !== undefined && { endTime }),
      ...(room !== undefined && { room: room || null })
    },
    include: morningEntryInclude
  });
  const entry = mapMorningEntry(row);

  res.json({ message: 'Timetable entry updated successfully', entry });
});

// DELETE /timetable/:id
const deleteTimetableEntry = catchAsync(async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.morningTimetable.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Timetable entry not found');
  await prisma.morningTimetable.delete({ where: { id } });

  res.json({ message: 'Timetable entry deleted successfully' });
});

// DELETE /timetable/class/:classId/clear
const clearClassTimetable = catchAsync(async (req, res) => {
  const { classId } = req.params;

  await prisma.morningTimetable.deleteMany({ where: { morningClassId: classId } });

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
