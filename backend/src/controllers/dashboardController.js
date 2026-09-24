const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { ACTIVE_ENROLLMENT } = require('../utils/enrollment');

const getAdminStats = catchAsync(async (req, res) => {
  const [totalStudents, passedOutStudents, totalTeachers, totalClasses, classStats] = await Promise.all([
    prisma.enrollment.count({ where: ACTIVE_ENROLLMENT }),
    // Counted off Student, not Enrollment: an alumnus who was never enrolled
    // in a class still belongs in this total, and the two never double-count
    // because ACTIVE_ENROLLMENT excludes exactly this status.
    prisma.student.count({ where: { status: 'PASSED_OUT' } }),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.class.findMany({
      include: { _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } } },
      orderBy: { name: 'asc' }
    }),
  ]);

  res.json({
    stats: { totalStudents, passedOutStudents, totalTeachers, totalClasses },
    classStats: classStats.map(c => ({
      id: c.id, name: c.name, gradeLevel: c.gradeLevel, studentCount: c._count.enrollments
    }))
  });
});

const getTeacherStats = catchAsync(async (req, res) => {
  const teacherId = req.user.teacher?.id;
  if (!teacherId) throw new AppError(400, { message: 'Teacher profile not found' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const subjectAssignments = await prisma.subjectTeacher.findMany({
    where: { teacherId },
    include: {
      subject: {
        include: {
          classes: { select: { id: true, name: true, gradeLevel: true } }
        }
      }
    }
  });

  // A subject can now span multiple classes — flatten into one row per
  // (subject, class) pair so per-class stats stay accurate.
  const subjectClassPairs = [];
  subjectAssignments.forEach(a => {
    (a.subject.classes || []).forEach(cls => {
      subjectClassPairs.push({ subjectId: a.subjectId, subjectName: a.subject.name, classId: cls.id, className: cls.name, gradeLevel: cls.gradeLevel });
    });
  });

  // The attendance page shows all active students in the class.
  // Use the same source so the dashboard count matches.
  const classIds = [...new Set(subjectClassPairs.map(p => p.classId))];

  const enrollments = await prisma.enrollment.findMany({
    where: { classId: { in: classIds }, isActive: true },
    select: { studentId: true, classId: true }
  });

  // Per-class unique active student count
  const classStudentMap = {};
  for (const id of classIds) classStudentMap[id] = new Set();
  for (const e of enrollments) {
    if (e.classId) classStudentMap[e.classId].add(e.studentId);
  }

  // Total unique students — derive from classStudentMap so it stays
  // consistent with the per-subject card counts.
  const allStudentIds = new Set();
  for (const studentSet of Object.values(classStudentMap)) {
    for (const id of studentSet) allStudentIds.add(id);
  }
  const totalStudents = allStudentIds.size;

  const todayAttendance = await prisma.attendance.findMany({ where: { teacherId, date: today } });
  const markedCount = todayAttendance.length;

  res.json({
    teacher: { id: teacherId, name: req.user.teacher.name },
    stats: {
      totalSubjects: subjectAssignments.length,
      totalStudents,
      todayAttendance: {
        marked: markedCount,
        pending: Math.max(0, totalStudents - markedCount),
        present: todayAttendance.filter(a => a.status === 'PRESENT').length,
        absent:  todayAttendance.filter(a => a.status === 'ABSENT').length,
        leave:   todayAttendance.filter(a => a.status === 'LEAVE').length
      }
    },
    // Attendance is marked per class, not per subject — group the
    // (subject, class) pairs down to one card per class so a teacher who
    // teaches several subjects in the same class isn't shown duplicate
    // "Mark Attendance" cards for it.
    classes: Object.values(
      subjectClassPairs.reduce((acc, p) => {
        if (!acc[p.classId]) {
          acc[p.classId] = {
            key: String(p.classId),
            classId: p.classId,
            className: p.className,
            gradeLevel: p.gradeLevel,
            subjectNames: [],
            studentCount: classStudentMap[p.classId]?.size ?? 0
          };
        }
        acc[p.classId].subjectNames.push(p.subjectName);
        return acc;
      }, {})
    )
  });
});

const getStudentDashboard = catchAsync(async (req, res) => {
  const studentId = req.user.student?.id;
  if (!studentId) throw new AppError(400, { message: 'Student profile not found' });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get today's day of week for timetable (as DayOfWeek enum)
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDayOfWeek = daysOfWeek[now.getDay()];

  // Get the student's class enrollment
  const mainEnrollment = await prisma.enrollment.findUnique({
    where: { studentId },
    include: {
      class: {
        include: {
          subjects: {
            select: { id: true, name: true }
          },
          _count: {
            select: { subjects: true }
          }
        }
      }
    }
  });

  const allEnrollments = mainEnrollment ? [mainEnrollment] : [];

  // Then fetch other data in parallel
  const classIds = allEnrollments.map(e => e.classId).filter(Boolean);
  const [student, studentSubjects, attendances, timetableEntries] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, fatherName: true, rollNumber: true, dateOfBirth: true, gender: true, address: true, phone: true, guardianPhone: true, joiningDate: true, profilePicUrl: true }
    }),
    prisma.studentSubject.findMany({ where: { studentId } }),
    prisma.attendance.findMany({
      where: { studentId, date: { gte: monthStart, lte: monthEnd } }
    }),
    classIds.length > 0 ? prisma.timetable.findMany({
      where: { classId: { in: classIds }, dayOfWeek: todayDayOfWeek },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        class: { select: { id: true, name: true } }
      },
      orderBy: { startTime: 'asc' }
    }) : []
  ]);

  const primaryClass = mainEnrollment?.class;
  const classNames = allEnrollments.map(e => e.class.name).join(', ') || 'N/A';

  // Calculate attendance stats
  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent  = attendances.filter(a => a.status === 'ABSENT').length;
  const leave   = attendances.filter(a => a.status === 'LEAVE').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // Get enrolled subject IDs from actual student enrollments
  const enrolledSubjectIds = studentSubjects.map(s => s.subjectId);

  // Transform timetable entries to match dashboard format — every lecture
  // scheduled today for the student's enrolled class(es).
  const todaysLectures = (timetableEntries || [])
    .map(entry => ({
      id: entry.id,
      subject: entry.subject,
      class: entry.class,
      teacher: entry.teacher,
      startTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${entry.startTime}`,
      endTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${entry.endTime}`,
      room: entry.room,
      duration: entry.duration || 60
    }));

  // Build enrolled classes — filter subjects to only ones the student is enrolled in
  const enrolledSubjectIdSet = new Set(enrolledSubjectIds);
  const enrolledClasses = allEnrollments.map(enrollment => ({
    id: enrollment.class.id,
    name: enrollment.class.name,
    subjects: (enrollment.class.subjects || []).filter(s => enrolledSubjectIdSet.has(s.id)),
    teacherCount: 0,
    createdAt: enrollment.class.createdAt
  }));

  res.json({
    student: {
      id: student.id,
      name: student.name,
      fatherName: student.fatherName,
      rollNumber: student.rollNumber,
      profilePicUrl: student.profilePicUrl || null,
      class: classNames,
      className: classNames,
      gradeLevel: primaryClass?.gradeLevel || 'N/A',
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      address: student.address,
      phone: student.phone,
      guardianPhone: student.guardianPhone,
      monthlyFee: mainEnrollment?.monthlyFee ?? 0,
      joiningDate: student.joiningDate,
      enrolledClasses: enrolledClasses,
      enrolledSubjectCount: studentSubjects.length
    },
    attendanceStats: {
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      total, present, absent, leave, percentage
    },
    timetable: todaysLectures,
    enrolledClasses: enrolledClasses
  });
});

// ── Recent attendance ─────────────────────────────────────────────────────────
// Feeds the attendance chart on the admin and teacher dashboards.
//
// A day with nothing marked and a day where everyone was absent are completely
// different facts, and the old "today's attendance" card could not tell them
// apart. `marked` carries that distinction so the chart can draw an empty
// track for an unmarked day instead of a misleading 0% bar.

// The window is a rolling seven days ending today, so it always covers each
// weekday exactly once — which is what lets the timetable still decide which
// of those dates are teaching days.
const RANGE_DAYS = 7;

// Indexed by JS getDay(): 0 = Sunday.
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

// The chart is scoped by one of: a class id, a grade level, or everything the
// user can see. Grades reuse the GradeLevel enum spelling so the dropdown
// value, the API value and the column value are all the same string.
const ALL_CLASSES = 'all';
const GRADE_SCOPES = { GRADE_11: 'Grade 11', GRADE_12: 'Grade 12' };

// Local midnight `back` days ago. Attendance rows are written at local
// midnight (see attendanceController), so the range has to be built the same
// way or the edges land on the wrong day.
const startOfDayAgo = (back) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - back);
  return d;
};

// The classes this user may chart: every class for an admin, only the ones
// they actually teach for a teacher.
const chartableClasses = async (user) => {
  if (user.role === 'ADMIN') {
    return prisma.class.findMany({
      select: { id: true, name: true, gradeLevel: true },
      orderBy: { name: 'asc' }
    });
  }

  const teacherId = user.teacher?.id;
  if (!teacherId) return [];

  const assignments = await prisma.subjectTeacher.findMany({
    where: { teacherId },
    select: { subject: { select: { classes: { select: { id: true, name: true, gradeLevel: true } } } } }
  });

  // A subject can span several classes, and a teacher can hold several
  // subjects in one class — flatten and de-duplicate by id.
  const byId = new Map();
  assignments.forEach(a => (a.subject.classes || []).forEach(c => byId.set(c.id, c)));
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
};

// Resolves the requested scope against what this user may actually chart.
// Anything unrecognised — an unknown id, a class they do not teach, a junk
// string — degrades to the full aggregate rather than erroring or, worse,
// silently charting somebody else's class.
const resolveScope = (requested, classes) => {
  if (requested && requested !== ALL_CLASSES) {
    if (GRADE_SCOPES[requested]) {
      return {
        key: requested,
        label: GRADE_SCOPES[requested],
        ids: classes.filter(c => c.gradeLevel === requested).map(c => c.id)
      };
    }
    const one = classes.find(c => c.id === parseInt(requested, 10));
    if (one) return { key: one.id, label: one.name, ids: [one.id] };
  }
  return { key: ALL_CLASSES, label: 'All classes', ids: classes.map(c => c.id) };
};

// GET /dashboard/attendance-week?classId=<id|GRADE_11|GRADE_12|all>
const getWeeklyAttendance = catchAsync(async (req, res) => {
  const classes = await chartableClasses(req.user);

  // Rolling window: the six days before today, plus today.
  const rangeStart = startOfDayAgo(RANGE_DAYS - 1);
  const rangeEnd = startOfDayAgo(-1);   // exclusive: tomorrow 00:00

  if (classes.length === 0) {
    return res.json({ classes: [], classId: null, className: null, rangeStart, rangeEnd, days: [] });
  }

  // Scoping by an explicit id list rather than dropping the filter is what
  // keeps a teacher's aggregate to their own classes.
  const scope = resolveScope(req.query.classId, classes);
  const scopeIds = scope.ids;

  const rows = await prisma.attendance.groupBy({
    by: ['date', 'status'],
    where: { classId: { in: scopeIds }, date: { gte: rangeStart, lt: rangeEnd } },
    _count: { status: true }
  });

  // Index by day offset so a missing day stays missing rather than defaulting.
  const byOffset = new Map();
  for (const row of rows) {
    const offset = Math.round((new Date(row.date) - rangeStart) / 86400000);
    if (offset < 0 || offset >= RANGE_DAYS) continue;
    if (!byOffset.has(offset)) byOffset.set(offset, { present: 0, absent: 0, leave: 0 });
    const bucket = byOffset.get(offset);
    if (row.status === 'PRESENT') bucket.present += row._count.status;
    else if (row.status === 'ABSENT') bucket.absent += row._count.status;
    else if (row.status === 'LEAVE') bucket.leave += row._count.status;
  }

  // Which weekdays this scope actually teaches, per the timetable.
  const scheduled = await prisma.timetable.findMany({
    where: { classId: { in: scopeIds } },
    select: { dayOfWeek: true },
    distinct: ['dayOfWeek']
  });
  const taught = new Set(scheduled.map(t => t.dayOfWeek));
  const fromTimetable = taught.size > 0;

  // Walk the window oldest to newest so the chart reads left to right and
  // ends on today.
  const days = [];
  for (let offset = 0; offset < RANGE_DAYS; offset++) {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + offset);

    const bucket = byOffset.get(offset);
    const counts = bucket || { present: 0, absent: 0, leave: 0 };
    const total = counts.present + counts.absent + counts.leave;

    // A date earns its column by being a teaching day, or by having
    // attendance against it — a make-up class on an untaught day still
    // happened, so recorded fact wins over the schedule. With no timetable at
    // all, every day of the window is shown rather than a guessed week.
    const isTaught = taught.has(DAY_NAMES[date.getDay()]);
    if (fromTimetable && !isTaught && total === 0) continue;

    days.push({
      day: WEEKDAY_LABELS[date.getDay()],
      date,
      ...counts,
      total,
      marked: total > 0
    });
  }

  res.json({
    classes,
    classId: scope.key,
    className: scope.label,
    // A grade with no classes behind it is a real state the chart has to be
    // able to explain, so say how many classes the scope actually covers.
    scopeClassCount: scopeIds.length,
    // False means no timetable exists for this scope, so every day of the
    // window is shown rather than only its teaching days.
    daysFromTimetable: fromTimetable,
    rangeStart,
    rangeEnd,
    days
  });
});

module.exports = { getAdminStats, getTeacherStats, getStudentDashboard, getWeeklyAttendance };
