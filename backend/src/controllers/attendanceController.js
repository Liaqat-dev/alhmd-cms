const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

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

  // Auto-mark the marking teacher as PRESENT for this class today
  if (teacherId && results.length > 0) {
    try {
      await prisma.morningTeacherAttendance.upsert({
        where: {
          teacherId_morningClassId_date: {
            teacherId,
            morningClassId: classId,
            date: attendanceDate
          }
        },
        update: { status: 'PRESENT' },
        create: {
          teacherId,
          morningClassId: classId,
          date: attendanceDate,
          status: 'PRESENT'
        }
      });
    } catch (err) {
      console.error('Failed to mark teacher attendance:', err);
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
  const late = attendances.filter(a => a.status === 'LATE').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  res.json({ attendances, stats: { total, present, absent, late, percentage } });
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
    const late = records.filter(a => a.status === 'LATE').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      total, present, absent, late, percentage
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

  // Collect unique dates with records
  const dateSet = new Set();
  for (const a of allAttendances) {
    dateSet.add(toDateKey(a.date));
  }
  const dates = Array.from(dateSet).sort();

  // One record per student per day now (attendance is per class, not per subject)
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
    const late = statuses.filter(s => s === 'LATE').length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      records,
      stats: { total, present, absent, late, percentage },
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
  const late = attendances.filter(a => a.status === 'LATE').length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  res.json({ month: monthNum, year: yearNum, attendances, stats: { total, present, absent, late, percentage } });
});

// GET /attendance/teachers/summary — for each teacher, per-class presence
// this month, derived from the classes they're assigned a subject in.
const getTeacherAttendanceSummary = catchAsync(async (req, res) => {
  const { month, year } = req.query;
  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum  = parseInt(year)  || new Date().getFullYear();
  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate   = new Date(yearNum, monthNum, 0);
  endDate.setHours(23, 59, 59, 999);

  const teachers = await prisma.teacher.findMany({
    where: { morningSubjects: { some: {} } },
    select: {
      id: true, name: true,
      morningSubjects: {
        select: {
          subject: {
            select: { classes: { select: { id: true, name: true } } }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Distinct classes each teacher touches, via any subject assignment
  const teacherClassMap = new Map();
  teachers.forEach(t => {
    const m = new Map();
    t.morningSubjects.forEach(ms => (ms.subject.classes || []).forEach(c => m.set(c.id, c.name)));
    teacherClassMap.set(t.id, m);
  });
  const classIds = [...new Set(teachers.flatMap(t => [...teacherClassMap.get(t.id).keys()]))];

  const [taRecords, saRecords] = await Promise.all([
    prisma.morningTeacherAttendance.groupBy({
      by: ['teacherId', 'morningClassId'],
      where: { date: { gte: startDate, lte: endDate }, morningClassId: { in: classIds } },
      _count: { id: true }
    }),
    prisma.morningAttendance.findMany({
      where: { morningClassId: { in: classIds }, date: { gte: startDate, lte: endDate } },
      select: { morningClassId: true, date: true },
      distinct: ['morningClassId', 'date']
    })
  ]);

  const presentsMap = new Map(taRecords.map(r => [`${r.teacherId}:${r.morningClassId}`, r._count.id]));
  const lecturesMap = new Map();
  for (const r of saRecords) {
    lecturesMap.set(r.morningClassId, (lecturesMap.get(r.morningClassId) || 0) + 1);
  }

  res.json(teachers.map(t => ({
    teacherId: t.id, name: t.name,
    classes: [...teacherClassMap.get(t.id).entries()].map(([classId, className]) => ({
      classId,
      className,
      presents: presentsMap.get(`${t.id}:${classId}`) || 0,
      totalLectures: lecturesMap.get(classId) || 0
    }))
  })));
});

const getTeacherAttendanceGrid = catchAsync(async (req, res) => {
  const { month, year, teacherId } = req.query;

  const monthNum = parseInt(month) || new Date().getMonth() + 1;
  const yearNum = parseInt(year) || new Date().getFullYear();

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0);
  endDate.setHours(23, 59, 59, 999);

  const where = { date: { gte: startDate, lte: endDate } };
  if (teacherId) where.teacherId = teacherId;

  const records = await prisma.morningTeacherAttendance.findMany({
    where,
    include: {
      teacher: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' }
  });

  // Collect unique dates
  const dateSet = new Set();
  for (const r of records) {
    dateSet.add(r.date.toISOString().split('T')[0]);
  }
  const dates = Array.from(dateSet).sort();

  // Group by teacher
  const teacherMap = new Map();
  for (const r of records) {
    const tid = r.teacherId;
    if (!teacherMap.has(tid)) {
      teacherMap.set(tid, { teacherId: tid, name: r.teacher.name, records: {} });
    }
    const dateKey = r.date.toISOString().split('T')[0];
    // Keep PRESENT over anything else if multiple classes same day
    if (!teacherMap.get(tid).records[dateKey]) {
      teacherMap.get(tid).records[dateKey] = r.status;
    }
  }

  const teachers = Array.from(teacherMap.values()).map(t => {
    const statuses = Object.values(t.records);
    const present = statuses.filter(s => s === 'PRESENT').length;
    return {
      ...t,
      stats: { total: statuses.length, present, percentage: statuses.length > 0 ? Math.round((present / statuses.length) * 100) : 0 }
    };
  });

  // Sort by name
  teachers.sort((a, b) => a.name.localeCompare(b.name));

  res.json({ month: monthNum, year: yearNum, dates, teachers });
});

module.exports = {
  markAttendance,
  getAttendanceByClass,
  getStudentAttendance,
  getClassAttendanceReport,
  getClassAttendanceGrid,
  getMyAttendance,
  getTeacherAttendanceSummary,
  getTeacherAttendanceGrid,
};
