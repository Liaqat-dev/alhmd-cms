const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const getAdminStats = catchAsync(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalStudents, totalTeachers, totalClasses, recentEnrollments, classStats, todayAttendance] = await Promise.all([
    prisma.morningEnrollment.count({ where: { isActive: true } }),
    prisma.teacher.count(),
    prisma.morningClass.count(),
    prisma.morningEnrollment.findMany({
      take: 5,
      where: { isActive: true },
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: { select: { id: true, name: true, rollNumber: true, profilePicUrl: true } },
        morningClass: { select: { name: true } }
      }
    }),
    prisma.morningClass.findMany({
      include: { _count: { select: { enrollments: { where: { isActive: true } } } } },
      orderBy: { name: 'asc' }
    }),
    prisma.morningAttendance.groupBy({
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
    stats: { totalStudents, totalTeachers, totalClasses, todayAttendance: attendanceOverview },
    recentStudents: recentEnrollments.map(e => ({
      id: e.student.id,
      name: e.student.name,
      rollNumber: e.student.rollNumber,
      profilePicUrl: e.student.profilePicUrl || null,
      class: { name: e.morningClass.name }
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

  const subjectAssignments = await prisma.morningSubjectTeacher.findMany({
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

  const enrollments = await prisma.morningEnrollment.findMany({
    where: { morningClassId: { in: classIds }, isActive: true },
    select: { studentId: true, morningClassId: true }
  });

  // Per-class unique active student count
  const classStudentMap = {};
  for (const id of classIds) classStudentMap[id] = new Set();
  for (const e of enrollments) {
    if (e.morningClassId) classStudentMap[e.morningClassId].add(e.studentId);
  }

  // Total unique students — derive from classStudentMap so it stays
  // consistent with the per-subject card counts.
  const allStudentIds = new Set();
  for (const studentSet of Object.values(classStudentMap)) {
    for (const id of studentSet) allStudentIds.add(id);
  }
  const totalStudents = allStudentIds.size;

  const todayAttendance = await prisma.morningAttendance.findMany({ where: { teacherId, date: today } });
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
    subjects: subjectClassPairs.map(p => ({
      key: `${p.classId}:${p.subjectId}`,
      subjectId: p.subjectId,
      subjectName: p.subjectName,
      classId: p.classId,
      className: p.className,
      gradeLevel: p.gradeLevel,
      studentCount: classStudentMap[p.classId]?.size ?? 0
    }))
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
  const mainEnrollment = await prisma.morningEnrollment.findUnique({
    where: { studentId },
    include: {
      morningClass: {
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
  const classIds = allEnrollments.map(e => e.morningClassId).filter(Boolean);
  const [student, studentSubjects, attendances, timetableEntries] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, fatherName: true, rollNumber: true, dateOfBirth: true, gender: true, address: true, phone: true, guardianPhone: true, joiningDate: true, profilePicUrl: true }
    }),
    prisma.morningStudentSubject.findMany({ where: { studentId } }),
    prisma.morningAttendance.findMany({
      where: { studentId, date: { gte: monthStart, lte: monthEnd } }
    }),
    classIds.length > 0 ? prisma.morningTimetable.findMany({
      where: { morningClassId: { in: classIds }, dayOfWeek: todayDayOfWeek },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
        morningClass: { select: { id: true, name: true } }
      },
      orderBy: { startTime: 'asc' }
    }) : []
  ]);

  const primaryClass = mainEnrollment?.morningClass;
  const classNames = allEnrollments.map(e => e.morningClass.name).join(', ') || 'N/A';

  // Calculate attendance stats
  const total = attendances.length;
  const present = attendances.filter(a => a.status === 'PRESENT').length;
  const absent  = attendances.filter(a => a.status === 'ABSENT').length;
  const leave   = attendances.filter(a => a.status === 'LEAVE').length;
  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  // Get enrolled subject IDs from actual student enrollments
  const enrolledSubjectIds = studentSubjects.map(s => s.subjectId);

  // Transform timetable entries to match dashboard format - only for enrolled subjects
  const todaysLectures = (timetableEntries || [])
    .filter(entry => enrolledSubjectIds.includes(entry.subject.id))
    .map(entry => ({
      id: entry.id,
      subject: entry.subject,
      class: entry.morningClass,
      teacher: entry.teacher,
      startTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${entry.startTime}`,
      endTime: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${entry.endTime}`,
      room: entry.room,
      duration: entry.duration || 60
    }));

  // Build enrolled classes — filter subjects to only ones the student is enrolled in
  const enrolledSubjectIdSet = new Set(enrolledSubjectIds);
  const enrolledClasses = allEnrollments.map(enrollment => ({
    id: enrollment.morningClass.id,
    name: enrollment.morningClass.name,
    subjects: (enrollment.morningClass.subjects || []).filter(s => enrolledSubjectIdSet.has(s.id)),
    teacherCount: 0,
    createdAt: enrollment.morningClass.createdAt
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
