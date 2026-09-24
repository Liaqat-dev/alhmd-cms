const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { ACTIVE_ENROLLMENT } = require('../utils/enrollment');

const getAdminStats = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalStudents, passedOutStudents, totalTeachers, totalClasses, recentEnrollments, classStats, todayAttendance] = await Promise.all([
    prisma.enrollment.count({ where: ACTIVE_ENROLLMENT }),
    // Counted off Student, not Enrollment: an alumnus who was never enrolled
    // in a class still belongs in this total, and the two never double-count
    // because ACTIVE_ENROLLMENT excludes exactly this status.
    prisma.student.count({ where: { status: 'PASSED_OUT' } }),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.enrollment.findMany({
      take: 5,
      where: ACTIVE_ENROLLMENT,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, profilePicUrl: true } },
        class: { select: { name: true } }
      }
    }),
    prisma.class.findMany({
      include: { _count: { select: { enrollments: { where: ACTIVE_ENROLLMENT } } } },
      orderBy: { name: 'asc' }
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: { date: today },
      _count: { status: true }
    })
  ]);

  const attendanceOverview = {
    present: todayAttendance.find(a => a.status === 'PRESENT')?._count.status || 0,
    absent:  todayAttendance.find(a => a.status === 'ABSENT')?._count.status  || 0,
    leave:   todayAttendance.find(a => a.status === 'LEAVE')?._count.status   || 0
  };

  res.json({
    stats: { totalStudents, passedOutStudents, totalTeachers, totalClasses, todayAttendance: attendanceOverview },
    recentStudents: recentEnrollments.map(e => ({
      id: e.student.id,
      name: e.student.name,
      rollNumber: e.student.rollNumber,
      profilePicUrl: e.student.profilePicUrl || null,
      class: { name: e.class.name }
    })),
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

module.exports = { getAdminStats, getTeacherStats, getStudentDashboard };
