const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// ── Student attendance (per class, per day) ───────────────────────────────────

// POST /attendance/mark — attendance is recorded per class: every student
// actively enrolled in the class gets one record per day.
const markAttendance = catchAsync(async (req, res) => {
  const { date, classId, attendances } = req.body;
  const isAdmin = req.user.role === 'ADMIN';
  const teacherId = req.user.teacher?.id ?? null;

  if (!isAdmin && !teacherId) throw new AppError(400, { message: 'Teacher profile not found' });
  if (!date || !classId || !attendances || !Array.isArray(attendances)) {
    throw new AppError(400, { message: 'Date, class, and attendances array are required' });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const cls = await prisma.morningClass.findUnique({ where: { id: classId }, select: { id: true } });
  if (!cls) throw new AppError(400, { classId: 'Class not found' });

  // Non-admin teachers may only mark classes they actually teach a subject in
  if (!isAdmin) {
    const teacherHasClass = await prisma.morningSubjectTeacher.findFirst({
      where: { teacherId, subject: { classes: { some: { id: classId } } } }
    });
    if (!teacherHasClass) {
      throw new AppError(400, { message: 'You do not teach any subject in this class' });
    }
  }

  const results = [];

  for (const record of attendances) {
    const { studentId, status } = record;
    if (!studentId || !status) continue;

    // Validate student is actively enrolled in this class
    const enrolled = await prisma.morningEnrollment.findFirst({
      where: { studentId, morningClassId: classId, isActive: true }
    });
    if (!enrolled) {
      console.error(`Student ${studentId} is not actively enrolled in class ${classId}`);
      continue;
    }

    try {
      const attendance = await prisma.morningAttendance.upsert({
        where: {
          studentId_morningClassId_date: {
            studentId,
            morningClassId: classId,
            date: attendanceDate
          }
        },
        update: { status, teacherId },
        create: {
          studentId,
          teacherId,
          date: attendanceDate,
          status,
          morningClassId: classId
        },
        include: {
          student: { select: { id: true, name: true } },
          morningClass: { select: { id: true, name: true } }
        }
      });
      results.push(attendance);
    } catch (err) {
      console.error(`Failed to mark attendance for student ${studentId}:`, err);
    }
  }

  res.json({ message: 'Attendance marked successfully', count: results.length, attendances: results });
});

// GET /attendance/class/:classId — every actively enrolled student, with
// their status for the given date (or null if not yet marked)
const getAttendanceByClass = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const { date } = req.query;

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const enrollments = await prisma.morningEnrollment.findMany({
    where: { morningClassId: classId, isActive: true },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: { student: { name: 'asc' } }
  });

  const studentIds = enrollments.map(e => e.studentId);
  const attendanceRecords = await prisma.morningAttendance.findMany({
    where: { studentId: { in: studentIds }, morningClassId: classId, date: attendanceDate }
  });

  const attendanceMap = new Map(attendanceRecords.map(a => [a.studentId, a.status]));

  const attendanceData = enrollments.map(e => ({
    studentId: e.student.id,
    name: e.student.name,
    rollNumber: e.student.rollNumber,
    status: attendanceMap.get(e.student.id) || null
  }));

  res.json({ date: attendanceDate, attendance: attendanceData });
});

const getStudentAttendance = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { startDate, endDate, month, year } = req.query;

  let dateFilter = {};

  if (month && year) {
    dateFilter = {
      gte: new Date(parseInt(year), parseInt(month) - 1, 1),
      lte: new Date(parseInt(year), parseInt(month), 0)
    };
  } else if (startDate && endDate) {
    dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
  } else {
    const now = new Date();
    dateFilter = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
  }

  const attendances = await prisma.morningAttendance.findMany({
    where: { studentId, date: dateFilter },
    include: { teacher: { select: { name: true } }, morningClass: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' }
  });

  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent = attendances.filter(a => a.status === 'ABSENT').length;
  const leave = attendances.filter(a => a.status === 'LEAVE').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  res.json({ attendances, stats: { total, present, absent, leave, percentage } });
});

const getClassAttendanceReport = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const { month, year } = req.query;

  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);

  const enrollments = await prisma.morningEnrollment.findMany({
    where: { morningClassId: classId, isActive: true },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: { student: { name: 'asc' } }
  });
  const enrolledStudents = enrollments.map(e => ({ student: e.student }));

  const studentIds = enrolledStudents.map(e => e.student.id);
  const allAttendances = await prisma.morningAttendance.findMany({
    where: { studentId: { in: studentIds }, morningClassId: classId, date: { gte: startDate, lte: endDate } }
  });

  const byStudent = new Map();
  for (const a of allAttendances) {
    if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, []);
    byStudent.get(a.studentId).push(a);
  }

  const report = enrolledStudents.map(({ student }) => {
    const records = byStudent.get(student.id) || [];
    const total = records.length;
    const present = records.filter(a => a.status === 'PRESENT').length;
    const absent = records.filter(a => a.status === 'ABSENT').length;
    const leave = records.filter(a => a.status === 'LEAVE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      total, present, absent, leave, percentage
    };
  });

  res.json({ month: monthNum, year: yearNum, report });
});

const getClassAttendanceGrid = catchAsync(async (req, res) => {
  const { classId } = req.params;
  const { month, year } = req.query;

  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);
  endDate.setHours(23, 59, 59, 999);

  const enrollments = await prisma.morningEnrollment.findMany({
    where: { morningClassId: classId, isActive: true },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: { student: { name: 'asc' } }
  });
  const enrolledStudents = enrollments.map(e => ({ student: e.student }));

  const studentIds = enrolledStudents.map(e => e.student.id);
  const allAttendances = await prisma.morningAttendance.findMany({
    where: { studentId: { in: studentIds }, morningClassId: classId, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' }
  });

  // Use local date to avoid UTC offset shifting the date (e.g. PKT midnight = UTC prev day)
  const toDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dateSet = new Set();
  for (const a of allAttendances) {
    dateSet.add(toDateKey(a.date));
  }
  const dates = Array.from(dateSet).sort();

  // One record per student per day (attendance is per class, not per subject)
  const byStudent = new Map();
  for (const a of allAttendances) {
    if (!byStudent.has(a.studentId)) byStudent.set(a.studentId, {});
    byStudent.get(a.studentId)[toDateKey(a.date)] = a.status;
  }

  const students = enrolledStudents.map(({ student }) => {
    const records = byStudent.get(student.id) || {};
    const statuses = Object.values(records);
    const total = statuses.length;
    const present = statuses.filter(s => s === 'PRESENT').length;
    const absent = statuses.filter(s => s === 'ABSENT').length;
    const leave = statuses.filter(s => s === 'LEAVE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      records,
      stats: { total, present, absent, leave, percentage },
    };
  });

  res.json({ month: monthNum, year: yearNum, dates, students });
});

const getMyAttendance = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id;
  if (!studentId) throw new AppError(400, { message: 'Student profile not found' });

  const { month, year } = req.query;
  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const attendances = await prisma.morningAttendance.findMany({
    where: {
      studentId,
      date: {
        gte: new Date(yearNum, monthNum - 1, 1),
        lte: new Date(yearNum, monthNum, 0)
      }
    },
    include: { morningClass: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' }
  });

  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent = attendances.filter(a => a.status === 'ABSENT').length;
  const leave = attendances.filter(a => a.status === 'LEAVE').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  res.json({ month: monthNum, year: yearNum, attendances, stats: { total, present, absent, leave, percentage } });
});

// ── Teacher attendance (every teacher, per day — no class involved) ──────────

// POST /attendance/mark-teachers
const markTeacherAttendance = catchAsync(async (req, res) => {
  const { date, attendances } = req.body;

  if (!date || !attendances || !Array.isArray(attendances)) {
    throw new AppError(400, { message: 'Date and attendances array are required' });
  }

  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  const results = [];

  for (const record of attendances) {
    const { teacherId, status } = record;
    if (!teacherId || !status) continue;

    try {
      const attendance = await prisma.morningTeacherAttendance.upsert({
        where: { teacherId_date: { teacherId, date: attendanceDate } },
        update: { status, markedBy: req.user.id },
        create: { teacherId, date: attendanceDate, status, markedBy: req.user.id },
        include: { teacher: { select: { id: true, name: true } } }
      });
      results.push(attendance);
    } catch (err) {
      console.error(`Failed to mark attendance for teacher ${teacherId}:`, err);
    }
  }

  res.json({ message: 'Teacher attendance marked successfully', count: results.length, attendances: results });
});

// GET /attendance/teachers — every teacher, with their status for the given date
const getTeacherAttendanceByDate = catchAsync(async (req, res) => {
  const { date } = req.query;

  const attendanceDate = date ? new Date(date) : new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const records = await prisma.morningTeacherAttendance.findMany({
    where: { teacherId: { in: teachers.map(t => t.id) }, date: attendanceDate }
  });
  const statusMap = new Map(records.map(r => [r.teacherId, r.status]));

  const attendance = teachers.map(t => ({
    teacherId: t.id,
    name: t.name,
    status: statusMap.get(t.id) || null
  }));

  res.json({ date: attendanceDate, attendance });
});

// GET /attendance/teachers/report — monthly per-teacher present/absent/leave totals
const getTeacherAttendanceReport = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const allAttendances = await prisma.morningTeacherAttendance.findMany({
    where: { teacherId: { in: teachers.map(t => t.id) }, date: { gte: startDate, lte: endDate } }
  });

  const byTeacher = new Map();
  for (const a of allAttendances) {
    if (!byTeacher.has(a.teacherId)) byTeacher.set(a.teacherId, []);
    byTeacher.get(a.teacherId).push(a);
  }

  const report = teachers.map(teacher => {
    const records = byTeacher.get(teacher.id) || [];
    const total = records.length;
    const present = records.filter(a => a.status === 'PRESENT').length;
    const absent = records.filter(a => a.status === 'ABSENT').length;
    const leave = records.filter(a => a.status === 'LEAVE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      teacherId: teacher.id,
      name: teacher.name,
      total, present, absent, leave, percentage
    };
  });

  res.json({ month: monthNum, year: yearNum, report });
});

// GET /attendance/teachers/grid — monthly per-day grid across all teachers
const getTeacherAttendanceGrid = catchAsync(async (req, res) => {
  const { month, year } = req.query;

  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);
  endDate.setHours(23, 59, 59, 999);

  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const allAttendances = await prisma.morningTeacherAttendance.findMany({
    where: { teacherId: { in: teachers.map(t => t.id) }, date: { gte: startDate, lte: endDate } },
    orderBy: { date: 'asc' }
  });

  const toDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dateSet = new Set();
  for (const a of allAttendances) dateSet.add(toDateKey(a.date));
  const dates = Array.from(dateSet).sort();

  const byTeacher = new Map();
  for (const a of allAttendances) {
    if (!byTeacher.has(a.teacherId)) byTeacher.set(a.teacherId, {});
    byTeacher.get(a.teacherId)[toDateKey(a.date)] = a.status;
  }

  const teacherRows = teachers.map(teacher => {
    const records = byTeacher.get(teacher.id) || {};
    const statuses = Object.values(records);
    const total = statuses.length;
    const present = statuses.filter(s => s === 'PRESENT').length;
    const absent = statuses.filter(s => s === 'ABSENT').length;
    const leave = statuses.filter(s => s === 'LEAVE').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      teacherId: teacher.id,
      name: teacher.name,
      records,
      stats: { total, present, absent, leave, percentage },
    };
  });

  res.json({ month: monthNum, year: yearNum, dates, teachers: teacherRows });
});

module.exports = {
  markAttendance,
  getAttendanceByClass,
  getStudentAttendance,
  getClassAttendanceReport,
  getClassAttendanceGrid,
  getMyAttendance,
  markTeacherAttendance,
  getTeacherAttendanceByDate,
  getTeacherAttendanceReport,
  getTeacherAttendanceGrid,
};
