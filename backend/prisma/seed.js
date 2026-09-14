const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function calcGrade(obtained, total) {
  const p = (obtained / total) * 100;
  if (p >= 90) return 'A*';
  if (p >= 80) return 'A';
  if (p >= 70) return 'B';
  if (p >= 60) return 'C';
  if (p >= 50) return 'D';
  return 'F';
}

async function main() {
  console.log('Seeding database...');

  // ── Admin ──────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'dev.liaqat13@gmail.com' },
    update: {},
    create: {
      email: 'dev.liaqat13@gmail.com',
      password: await bcrypt.hash('admin123', BCRYPT_ROUNDS),
      role: 'ADMIN',
      isVerified: true,
      admin: { create: { name: 'System Admin' } },
    },
  });
  const adminId = adminUser.id;
  console.log('✓ Admin:', adminUser.email);

  // ── Classes ──────────────────────────────────────────────────────────────────
  const clsDefs = [
    { name: 'ICS-I', gradeLevel: 'GRADE_11', program: 'ICS' },
    { name: 'ENG-I', gradeLevel: 'GRADE_12', program: 'ENG' },
  ];
  const mCls = {};
  for (const d of clsDefs) {
    mCls[d.name] = await prisma.morningClass.upsert({ where: { name: d.name }, update: {}, create: d });
  }
  console.log('✓ Classes:', Object.keys(mCls).join(', '));

  // ── Subjects ───────────────────────────────────────────────────────────────
  // A subject can be shared across multiple classes of the same grade level,
  // so we create/reuse one subject per (name, gradeLevel) and connect it to
  // every class of that grade level.
  const subjectNames = ['Mathematics', 'English', 'Physics'];

  const mSubj = {}; // 'ClassName::SubjName' → Subject (shared per gradeLevel)
  const subjByGradeName = {}; // 'gradeLevel::name' → Subject
  for (const [cn, cls] of Object.entries(mCls)) {
    for (const name of subjectNames) {
      const key = `${cls.gradeLevel}::${name}`;
      if (!subjByGradeName[key]) {
        subjByGradeName[key] = await prisma.morningSubject.upsert({
          where: { name_gradeLevel: { name, gradeLevel: cls.gradeLevel } },
          update: { classes: { connect: { id: cls.id } } },
          create: { name, gradeLevel: cls.gradeLevel, classes: { connect: { id: cls.id } } },
        });
      } else {
        subjByGradeName[key] = await prisma.morningSubject.update({
          where: { id: subjByGradeName[key].id },
          data: { classes: { connect: { id: cls.id } } },
        });
      }
      mSubj[`${cn}::${name}`] = subjByGradeName[key];
    }
  }
  console.log('✓ Subjects:', Object.keys(subjByGradeName).length);

  // ── Teachers (3) ─────────────────────────────────────────────────────────
  const teacherDefs = [
    { email: 'ali.hassan@gmail.com',  name: 'Ali Hassan',   phone: '03001111111', address: '10 Model Town, Lahore',
      tier: 'TIER_1',  additionalPay: 5000, basicSalary: 30000,
      qualifications: [
        { degreeTitle: 'BSc Mathematics', institute: 'University of the Punjab', startYear: 2010, endYear: 2014, totalMarksOrGpa: '4.0', obtainedMarksOrGpa: '3.6' },
        { degreeTitle: 'MSc Mathematics', institute: 'GC University Lahore', startYear: 2014, endYear: 2016, totalMarksOrGpa: '4.0', obtainedMarksOrGpa: '3.8' },
      ] },
    { email: 'sara.ahmed@gmail.com',  name: 'Sara Ahmed',   phone: '03002222222', address: '20 Gulberg III, Lahore',
      tier: 'TIER_2A', additionalPay: 3000, basicSalary: 22000,
      qualifications: [
        { degreeTitle: 'BA English Literature', institute: 'Kinnaird College', startYear: 2011, endYear: 2015, totalMarksOrGpa: '1100', obtainedMarksOrGpa: '920' },
      ] },
    { email: 'aisha.malik@gmail.com', name: 'Aisha Malik',  phone: '03004444444', address: '89 Township, Lahore',
      tier: 'TIER_2B', additionalPay: 2000, basicSalary: 18000,
      qualifications: [
        { degreeTitle: 'BSc Physics', institute: 'University of Engineering & Technology Lahore', startYear: 2012, endYear: 2016, totalMarksOrGpa: '4.0', obtainedMarksOrGpa: '3.4' },
      ] },
  ];
  const teachers = [];
  for (const td of teacherDefs) {
    const u = await prisma.user.upsert({
      where: { email: td.email },
      update: {},
      create: {
        email: td.email,
        password: await bcrypt.hash('teacher123', BCRYPT_ROUNDS),
        role: 'TEACHER', isVerified: true,
        teacher: { create: {
          name: td.name, phone: td.phone, address: td.address,
          tier: td.tier, additionalPay: td.additionalPay,
          basicSalary: td.basicSalary,
          qualifications: { create: td.qualifications },
        } },
      },
      include: { teacher: true },
    });
    teachers.push(u.teacher);
  }
  const [T1, T2, T4] = teachers;
  // T1 Ali (Math) · T2 Sara (Eng) · T4 Aisha (Phy)
  console.log('✓ Teachers:', teachers.map(t => t.name).join(', '));

  // ── Teacher → Subject assignments ───────────────────────────────────────────
  const mSubjTeacher = { Mathematics: T1, English: T2, Physics: T4 };
  for (const cn of Object.keys(mCls)) {
    for (const sn of subjectNames) {
      await prisma.morningSubjectTeacher.upsert({
        where: { subjectId_teacherId: { subjectId: mSubj[`${cn}::${sn}`].id, teacherId: mSubjTeacher[sn].id } },
        update: {}, create: { subjectId: mSubj[`${cn}::${sn}`].id, teacherId: mSubjTeacher[sn].id },
      });
    }
  }
  console.log('✓ Teacher-subject assignments done');

  // ── Timetable (unique [class,day,startTime] enforced) ───────────────────────
  const mTTDefs = [
    { cls: 'ICS-I',        subj: 'Mathematics', T: T1, day: 'MONDAY',    s: '08:00', e: '09:00', room: 'R-101' },
    { cls: 'ICS-I',        subj: 'English',     T: T2, day: 'MONDAY',    s: '09:00', e: '10:00', room: 'R-101' },
    { cls: 'ENG-I',        subj: 'Mathematics', T: T1, day: 'MONDAY',    s: '10:00', e: '11:00', room: 'R-102' },
    { cls: 'ICS-I',        subj: 'Physics',     T: T4, day: 'TUESDAY',   s: '09:00', e: '10:00', room: 'R-101' },
    { cls: 'ENG-I',        subj: 'Physics',     T: T4, day: 'TUESDAY',   s: '10:00', e: '11:00', room: 'R-102' },
  ];
  for (const d of mTTDefs) {
    await prisma.morningTimetable.upsert({
      where: { morningClassId_dayOfWeek_startTime: { morningClassId: mCls[d.cls].id, dayOfWeek: d.day, startTime: d.s } },
      update: {},
      create: { morningClassId: mCls[d.cls].id, subjectId: mSubj[`${d.cls}::${d.subj}`].id, teacherId: d.T.id, dayOfWeek: d.day, startTime: d.s, endTime: d.e, room: d.room },
    });
  }
  console.log('✓ Timetable:', mTTDefs.length, 'slots');

  // ── Students (3) — expenses ──────────────────────────────────────────────
  // morning:        { class, fee }
  // expenses:       [{ type, amount }] ← one-time charges (Admission Fee = registration fee)
  const studentDefs = [
    { name: 'Ali Ahmed',   fatherName: 'Ahmed Khan',    gender: 'MALE',   dob: '2009-05-15', cnic: '35202-1111111-1', school: 'City School',
      morning: { class: 'ICS-I', fee: 6000 },
      expenses: [{ type: 'ADMISSION_FEE', amount: 2000 }] },

    { name: 'Sara Malik',  fatherName: 'Malik Riaz',    gender: 'FEMALE', dob: '2007-08-22', cnic: '35202-2222222-2', school: 'Beaconhouse',
      morning: { class: 'ENG-I', fee: 8000 } },

    { name: 'Hamza Tariq', fatherName: 'Tariq Mehmood', gender: 'MALE',   dob: '2009-03-10', cnic: '35202-3333333-3', school: 'LGS',
      morning: { class: 'ICS-I', fee: 6000 },
      expenses: [{ type: 'BOOKS', amount: 1200 }] },
  ];

  const studentRecs = {}; // name → Student
  for (let i = 0; i < studentDefs.length; i++) {
    const sd = studentDefs[i];
    const roll = `${String(i + 1).padStart(4, '0')}-${currentYear}`;
    const email = `${roll}@gmail.com`;

    // Students are no longer backed by a User account — they log in with
    // rollNumber + password directly. Email is optional (password reset only).
    const st = await prisma.student.upsert({
      where: { rollNumber: roll },
      update: {},
      create: {
        rollNumber: roll,
        password: await bcrypt.hash(roll, BCRYPT_ROUNDS),
        email,
        name: sd.name, fatherName: sd.fatherName,
        dateOfBirth: new Date(sd.dob), gender: sd.gender,
        cnic: sd.cnic, schoolName: sd.school,
        address: `House ${i + 1}, Street 5, Lahore`,
        guardianPhone: `0300${String(1000000 + i)}`, phone: `0301${String(1000000 + i)}`,
        joiningDate: new Date('2025-04-01'), academicYear: '2025-2026',
        status: 'ENROLLED',
      },
    });
    studentRecs[sd.name] = st;

    // Morning regular + all subjects
    if (sd.morning) {
      const cls = mCls[sd.morning.class];
      await prisma.morningEnrollment.upsert({
        where: { studentId: st.id },
        update: {}, create: { studentId: st.id, morningClassId: cls.id, monthlyFee: sd.morning.fee },
      });
      for (const sn of subjectNames) {
        const subj = mSubj[`${sd.morning.class}::${sn}`];
        await prisma.morningStudentSubject.upsert({
          where: { studentId_subjectId: { studentId: st.id, subjectId: subj.id } },
          update: {}, create: { studentId: st.id, subjectId: subj.id },
        });
      }
    }
    // One-time expenses (idempotent)
    for (const exp of sd.expenses ?? []) {
      const existing = await prisma.studentExpense.findFirst({
        where: { studentId: st.id, type: exp.type, month: currentMonth, year: currentYear },
      });
      if (!existing) {
        await prisma.studentExpense.create({
          data: { studentId: st.id, type: exp.type, label: exp.label ?? null, amount: exp.amount, month: currentMonth, year: currentYear, createdBy: adminId },
        });
      }
    }
  }
  console.log('✓ Students created:', Object.keys(studentRecs).length);

  // ── Exams + Marks (idempotent by title) ────────────────────────────────────
  const ensureMorningExam = async (title, data, marks) => {
    let exam = await prisma.morningExam.findFirst({ where: { title } });
    if (!exam) exam = await prisma.morningExam.create({ data: { title, ...data, createdBy: adminId } });
    for (const m of marks) {
      await prisma.morningMark.upsert({
        where: { examId_studentId: { examId: exam.id, studentId: m.student.id } },
        update: {}, create: { examId: exam.id, studentId: m.student.id, obtainedMarks: m.obt, grade: calcGrade(m.obt, data.totalMarks), remarks: m.remarks, gradedBy: adminId },
      });
    }
  };

  await ensureMorningExam('Mathematics Monthly Test', {
    examType: 'MONTHLY_TEST', morningClassId: mCls['ICS-I'].id, subjectId: mSubj['ICS-I::Mathematics'].id,
    totalMarks: 50, passingMarks: 25, scheduledDate: new Date('2026-04-05'),
  }, [
    { student: studentRecs['Ali Ahmed'],  obt: 38, remarks: 'Well done' },
    { student: studentRecs['Hamza Tariq'], obt: 22, remarks: 'Needs improvement' },
  ]);
  await ensureMorningExam('English Weekly Quiz', {
    examType: 'QUIZ', morningClassId: mCls['ENG-I'].id, subjectId: mSubj['ENG-I::English'].id,
    totalMarks: 20, passingMarks: 10, scheduledDate: new Date('2026-04-10'),
  }, [
    { student: studentRecs['Sara Malik'], obt: 17, remarks: 'Excellent' },
  ]);
  console.log('✓ Exams + marks done');

  // ── Permissions + Roles (RBAC) ───────────────────────────────────────────────
  // Every resource gets its own view/create/edit/delete permissions (rather
  // than one combined "manage") so a role can be granted exactly the actions
  // it needs — e.g. a teacher who can enter marks but not delete exams.
  const CRUD_RESOURCES = [
    { key: 'students',      category: 'Students',      label: 'students' },
    { key: 'teachers',      category: 'Teachers',      label: 'teachers' },
    { key: 'classes',       category: 'Classes',       label: 'classes' },
    { key: 'subjects',      category: 'Subjects',      label: 'subjects' },
    { key: 'timetable',     category: 'Timetable',     label: 'timetable entries' },
    { key: 'attendance',        category: 'Attendance',         label: 'student attendance records' },
    { key: 'teacherAttendance', category: 'Teacher Attendance', label: 'teacher attendance records' },
    { key: 'marks',         category: 'Marks',         label: 'exams and marks' },
    { key: 'fees',          category: 'Fees',          label: 'fee challans' },
    { key: 'salaries',      category: 'Salaries',      label: 'teacher salaries' },
    { key: 'announcements', category: 'Announcements', label: 'announcements' },
    { key: 'reports',       category: 'Reports',       label: 'student reports' },
  ];
  const CRUD_ACTIONS = [
    { suffix: 'view',   verb: 'View' },
    { suffix: 'create', verb: 'Create' },
    { suffix: 'edit',   verb: 'Edit' },
    { suffix: 'delete', verb: 'Delete' },
  ];

  const PERMISSION_DEFS = [];
  for (const r of CRUD_RESOURCES) {
    for (const a of CRUD_ACTIONS) {
      PERMISSION_DEFS.push({
        name: `${r.key}.${a.suffix}`,
        category: r.category,
        description: `${a.verb} ${r.label}`,
      });
    }
  }
  // Users & Roles is meta-administration — kept admin-only (see route wiring),
  // but still catalogued for a consistent Roles-tab experience.
  PERMISSION_DEFS.push(
    { name: 'users.view',   category: 'Users & Roles', description: 'View user accounts' },
    { name: 'users.manage', category: 'Users & Roles', description: 'Assign roles to user accounts' },
    { name: 'roles.view',   category: 'Users & Roles', description: 'View roles and permissions' },
    { name: 'roles.create', category: 'Users & Roles', description: 'Create roles' },
    { name: 'roles.edit',   category: 'Users & Roles', description: 'Edit roles and their permissions' },
    { name: 'roles.delete', category: 'Users & Roles', description: 'Delete roles' },
  );

  const permByName = {};
  for (const p of PERMISSION_DEFS) {
    permByName[p.name] = await prisma.permission.upsert({
      where: { name: p.name },
      update: { category: p.category, description: p.description },
      create: p,
    });
  }
  // Prune any permission from an older catalog shape (e.g. the retired
  // combined "*.manage" permissions) so the catalog never drifts stale.
  const currentNames = PERMISSION_DEFS.map(p => p.name);
  const pruned = await prisma.permission.deleteMany({ where: { name: { notIn: currentNames } } });
  console.log('✓ Permissions:', PERMISSION_DEFS.length, pruned.count > 0 ? `(pruned ${pruned.count} stale)` : '');

  const allPermissionIds = Object.values(permByName).map(p => ({ id: p.id }));
  // A regular teacher's everyday duties: full control over attendance/marks
  // for their own classes, view-only elsewhere, no deletes.
  const teachingPermissionIds = [
    'students.view', 'classes.view', 'subjects.view',
    'timetable.view',
    'attendance.view', 'attendance.create', 'attendance.edit',
    'marks.view', 'marks.create', 'marks.edit',
    'reports.view', 'reports.create', 'reports.edit',
    'announcements.view',
  ].map(n => ({ id: permByName[n].id }));

  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: { permissions: { set: allPermissionIds } },
    create: { name: 'Administrator', description: 'Full access to all system features', permissions: { connect: allPermissionIds } },
  });
  const teacherRole = await prisma.role.upsert({
    where: { name: 'Class Teacher' },
    update: { permissions: { set: teachingPermissionIds } },
    create: { name: 'Class Teacher', description: 'Everyday teaching duties — attendance, marks, timetable', permissions: { connect: teachingPermissionIds } },
  });
  console.log('✓ Roles: Administrator, Class Teacher');

  await prisma.user.update({ where: { id: adminId }, data: { roles: { set: [{ id: adminRole.id }] } } });
  for (const t of teachers) {
    await prisma.user.update({ where: { id: t.userId }, data: { roles: { set: [{ id: teacherRole.id }] } } });
  }
  console.log('✓ Role assignments done');

  // ── Announcements (idempotent by title) ────────────────────────────────────
  const announcements = [
    { title: 'April Exam Schedule Released', audience: 'STUDENTS', priority: 'URGENT', expiresAt: new Date('2026-04-30'),
      content: 'The examination schedule for April 2026 has been published. Students should check their class timetables and prepare accordingly.' },
    { title: 'Teacher Professional Development Workshop', audience: 'TEACHERS', priority: 'NORMAL', expiresAt: new Date('2026-04-27'),
      content: 'A professional development workshop will be held on Saturday 26 April 2026, 10:00 AM – 2:00 PM in the main hall. Attendance is mandatory.' },
    { title: 'Annual Sports Day – Save the Date', audience: 'BOTH', priority: 'INFORMATIONAL', expiresAt: new Date('2026-05-11'),
      content: 'CGA Annual Sports Day 2026 is scheduled for 10 May 2026 on the main ground. Registration opens 28 April.' },
  ];
  for (const a of announcements) {
    const exists = await prisma.announcement.findFirst({ where: { title: a.title } });
    if (!exists) await prisma.announcement.create({ data: { ...a, createdBy: adminId } });
  }
  console.log('✓ Announcements created:', announcements.length);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n── Seed complete ──────────────────────────────────────────────────');
  console.log('  Admin    : dev.liaqat13@gmail.com / admin123');
  console.log('  Teachers : 3  (…@gmail.com / teacher123)');
  console.log(`  Students : 3  Login with rollNumber as password (0001-${currentYear} … 0003-${currentYear}).`);
  console.log('  Classes  : ICS-I / ENG-I');
  console.log(`  Timetable: ${mTTDefs.length} slots`);
  console.log('  Exams    : 2 (with marks)');
  console.log('  Expenses : Admission Fee / Books seeded');
  console.log('  Roles    : Administrator (admin), Class Teacher (3 teachers)');
  console.log('──────────────────────────────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
