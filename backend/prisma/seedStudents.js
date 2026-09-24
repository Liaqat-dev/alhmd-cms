// ── Seed: 20 students + 4 teachers + a weekly timetable ──────────────────────
// Standalone, additive seed. It ONLY inserts rows:
//   Student  →  its single Enrollment  →  its StudentSubject rows
//   Teacher  →  its User login  →  its SubjectTeacher assignments
//   Timetable slots for the classes that actually have subjects
// It never deletes, updates or truncates anything, and it never touches
// classes, subjects, attendance, challans, existing teachers or any other
// existing record. Students and teachers are attached to whatever classes and
// subjects already exist in the database (read at runtime — nothing is
// hardcoded), and each roll number comes from
// src/utils/helpers.generateRollNumber, so serials are drawn from the shared
// RollNumberSequence counter and can never collide with existing numbers.
//
// RE-RUNNING THIS SCRIPT IS SAFE — every section is guarded:
//   • Students  — looked up by name + fatherName before anything is written.
//     A match is skipped entirely: no roll number claimed, nothing written,
//     nothing updated.
//   • Teachers  — looked up by login email. A match is skipped; the existing
//     teacher is reused for the subject assignments and timetable.
//   • Subject assignments — createMany({ skipDuplicates: true }) against the
//     @@unique([subjectId, teacherId]) constraint.
//   • Timetable  — any (class, day, start time) already taken in the DB is
//     left exactly as it is, and a teacher is never double-booked (the same
//     two rules the timetable controller enforces).
//   So a second run creates nothing, reports everything as skipped, exits 0.
//
// Each student is written with a single nested create, which Prisma executes
// in one transaction — so a failure can never leave a student without an
// enrollment; the same holds for a teacher and their User login. If a create
// does fail mid-run, earlier rows stay committed and the script can simply be
// run again (the guards above skip whatever already landed).
//
// Usage:  node prisma/seedStudents.js      (from backend/)
//   or:   npm run seed:students
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateRollNumber } = require('../src/utils/helpers');

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 10;          // matches src/controllers/studentController.js
const ACADEMIC_YEAR = '2025-2026'; // matches the students already in the DB

// Monthly fee per program; grade 12 pays a little more. Falls back for any
// program not listed here.
const PROGRAM_FEE = { MED: 4200, ENG: 4000, ICS: 3500, IT: 3600, FA: 2800 };
const DEFAULT_FEE = 3000;

const feeForClass = (cls) =>
  (PROGRAM_FEE[cls.program] ?? DEFAULT_FEE) + (cls.gradeLevel === 'GRADE_12' ? 500 : 0);

// 20 distinct students. Their class is assigned at runtime from the real classes.
const STUDENTS = [
  { name: 'Ahmed Raza', gender: 'MALE', fatherName: 'Muhammad Raza', dateOfBirth: '2008-03-14', joiningDate: '2025-04-01', address: 'House 14, Street 6, Gulberg III, Lahore', phone: '0301-4412987', guardianPhone: '0300-8451276', schoolName: 'Government High School Gulberg' },
  { name: 'Ayesha Siddiqui', gender: 'FEMALE', fatherName: 'Tanveer Siddiqui', dateOfBirth: '2008-07-02', joiningDate: '2025-04-03', address: 'Flat 22-B, Askari 10, Lahore Cantt', phone: '0333-7721460', guardianPhone: '0321-9083344', schoolName: 'Lahore Grammar School' },
  { name: 'Bilal Hussain', gender: 'MALE', fatherName: 'Ghulam Hussain', dateOfBirth: '2009-01-22', joiningDate: '2025-04-07', address: 'Mohallah Islampura, Near Jamia Masjid, Sheikhupura', phone: '0345-6610238', guardianPhone: '0301-2276548', schoolName: 'Crescent Model School' },
  { name: 'Fatima Noor', gender: 'FEMALE', fatherName: 'Shahid Mehmood', dateOfBirth: '2008-11-09', joiningDate: '2025-04-10', address: 'House 9, Block C, Johar Town, Lahore', phone: '0322-5590117', guardianPhone: '0300-7719042', schoolName: 'Divisional Public School' },
  { name: 'Hassan Javed', gender: 'MALE', fatherName: 'Javed Iqbal', dateOfBirth: '2008-05-30', joiningDate: '2025-04-15', address: 'Street 3, Chungi Amar Sidhu, Ferozepur Road, Lahore', phone: '0308-4478219', guardianPhone: '0333-5514408', schoolName: 'Government MC High School' },

  { name: 'Zainab Akhtar', gender: 'FEMALE', fatherName: 'Naveed Akhtar', dateOfBirth: '2007-09-18', joiningDate: '2025-04-18', address: 'House 41, Phase 4, DHA, Lahore', phone: '0300-3367415', guardianPhone: '0321-4408876', schoolName: 'Beaconhouse School System' },
  { name: 'Usman Ghani', gender: 'MALE', fatherName: 'Abdul Ghani', dateOfBirth: '2007-12-05', joiningDate: '2025-04-22', address: 'Chak 45, Tehsil Jaranwala, Faisalabad', phone: '0313-8827604', guardianPhone: '0300-6612390', schoolName: 'Government High School Jaranwala' },
  { name: 'Maryam Bashir', gender: 'FEMALE', fatherName: 'Bashir Ahmad', dateOfBirth: '2008-02-11', joiningDate: '2025-05-02', address: 'House 78, Samanabad, Lahore', phone: '0342-1195733', guardianPhone: '0345-7740125', schoolName: 'Kinnaird Girls High School' },
  { name: 'Hamza Saeed', gender: 'MALE', fatherName: 'Saeed Anwar', dateOfBirth: '2007-06-27', joiningDate: '2025-05-06', address: 'Mohallah Rehmanpura, Kasur Road, Lahore', phone: '0306-9942178', guardianPhone: '0301-3358092', schoolName: 'Punjab College Campus School' },
  { name: 'Iqra Rasheed', gender: 'FEMALE', fatherName: 'Rasheed Ahmed', dateOfBirth: '2007-10-14', joiningDate: '2025-05-09', address: 'House 5, Green Town, Lahore', phone: '0334-2208561', guardianPhone: '0300-9917734', schoolName: 'City Girls High School' },

  { name: 'Talha Mehmood', gender: 'MALE', fatherName: 'Khalid Mehmood', dateOfBirth: '2007-08-08', joiningDate: '2025-05-13', address: 'House 33, Wapda Town, Lahore', phone: '0302-6674120', guardianPhone: '0321-5583017', schoolName: 'Unique High School' },
  { name: 'Sana Khalid', gender: 'FEMALE', fatherName: 'Khalid Pervaiz', dateOfBirth: '2007-04-19', joiningDate: '2025-05-19', address: 'House 61, Model Town Link Road, Lahore', phone: '0347-3310952', guardianPhone: '0300-4426618', schoolName: 'Lahore College Girls School' },
  { name: 'Umar Farooq', gender: 'MALE', fatherName: 'Farooq Ahmed', dateOfBirth: '2008-01-03', joiningDate: '2025-05-23', address: 'Village Manga Mandi, Raiwind Road, Lahore', phone: '0314-7781266', guardianPhone: '0333-2209481', schoolName: 'Government High School Manga' },
  { name: 'Hira Zafar', gender: 'FEMALE', fatherName: 'Zafar Iqbal', dateOfBirth: '2007-11-26', joiningDate: '2025-06-02', address: 'House 12-A, Garden Town, Lahore', phone: '0320-5548903', guardianPhone: '0301-6673158', schoolName: 'Sacred Heart Girls School' },
  { name: 'Saad Nawaz', gender: 'MALE', fatherName: 'Nawaz Ali', dateOfBirth: '2007-07-21', joiningDate: '2025-06-06', address: 'Street 11, Shadbagh, Lahore', phone: '0311-9926447', guardianPhone: '0345-1130876', schoolName: 'Islamia High School Shadbagh' },

  { name: 'Noor Abbas', gender: 'FEMALE', fatherName: 'Abbas Ali', dateOfBirth: '2008-09-12', joiningDate: '2025-06-11', address: 'House 27, Faisal Town, Lahore', phone: '0335-4417290', guardianPhone: '0300-5582214', schoolName: 'Al-Noor Girls High School' },
  { name: 'Danish Aslam', gender: 'MALE', fatherName: 'Muhammad Aslam', dateOfBirth: '2009-02-28', joiningDate: '2025-06-17', address: 'Mohallah Nishtar Colony, Multan Road, Lahore', phone: '0303-7765813', guardianPhone: '0321-8840765', schoolName: 'Government High School Nishtar' },
  { name: 'Rabia Sultan', gender: 'FEMALE', fatherName: 'Sultan Ahmed', dateOfBirth: '2008-12-07', joiningDate: '2025-07-01', address: 'House 88, Township Sector C1, Lahore', phone: '0349-2236709', guardianPhone: '0300-1194523', schoolName: 'Falcon Girls School' },
  { name: 'Arslan Haider', gender: 'MALE', fatherName: 'Haider Ali', dateOfBirth: '2008-10-16', joiningDate: '2025-07-14', address: 'Street 2, Baghbanpura, Near Shalimar, Lahore', phone: '0307-5583491', guardianPhone: '0333-6648120', schoolName: 'Shalimar Model High School' },
  { name: 'Amna Yousaf', gender: 'FEMALE', fatherName: 'Yousaf Khan', dateOfBirth: '2009-04-05', joiningDate: '2025-08-04', address: 'House 19, Iqbal Town, Lahore', phone: '0316-8819034', guardianPhone: '0301-7726548', schoolName: 'Iqbal Girls High School' },
];

// ── Teachers ─────────────────────────────────────────────────────────────────
// Four new teachers, each with their own User login (role TEACHER). `teaches`
// is matched against real subject NAMES read from the database, so a teacher
// only ever gets assigned to subjects that actually exist. Ayesha Tariq is the
// relief teacher and shares Mathematics/English with the main two, which is
// how she picks up her own timetable slots.
const TEACHER_PASSWORD = 'teacher123'; // default login password, bcrypt-hashed below

const TEACHERS = [
  { name: 'Muhammad Irfan Sheikh', email: 'irfan.sheikh@gmail.com', phone: '0300-5567881', address: 'House 24, Block E, Johar Town, Lahore',  joiningDate: '2025-03-15', tier: 'TIER_1',   basicSalary: 35000, additionalPay: 5000, teaches: ['Mathematics'] },
  { name: 'Nadia Perveen',         email: 'nadia.perveen@gmail.com', phone: '0321-7734512', address: 'House 8, Street 14, Samanabad, Lahore',  joiningDate: '2025-03-20', tier: 'TIER_2A', basicSalary: 24000, additionalPay: 3000, teaches: ['English'] },
  { name: 'Kamran Yousaf',         email: 'kamran.yousaf@gmail.com', phone: '0333-4412098', address: 'House 56, Wapda Town Phase 1, Lahore',   joiningDate: '2025-04-02', tier: 'TIER_2B', basicSalary: 21000, additionalPay: 2500, teaches: ['Physics'] },
  { name: 'Ayesha Tariq',          email: 'ayesha.tariq@gmail.com',  phone: '0345-6628140', address: 'Flat 7-C, Askari 11, Lahore Cantt',      joiningDate: '2025-04-12', tier: 'TIER_3',  basicSalary: 18000, additionalPay: 1500, teaches: ['Mathematics', 'English'] },
];

// ── Timetable shape ──────────────────────────────────────────────────────────
// Monday–Friday, four one-hour periods. Subjects rotate through the week so
// every subject of a class comes up several times.
const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const PERIODS = [
  { startTime: '08:00', endTime: '09:00' },
  { startTime: '09:00', endTime: '10:00' },
  { startTime: '10:00', endTime: '11:00' },
  { startTime: '11:00', endTime: '12:00' },
];

// Same overlap test the timetable controller uses, so generated slots obey the
// rules the app enforces rather than just the database unique constraint.
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

// Split the roster evenly over however many classes exist.
const assignClasses = (students, classes) => {
  const perClass = Math.ceil(students.length / classes.length);
  return students.map((s, i) => ({
    ...s,
    cls: classes[Math.min(Math.floor(i / perClass), classes.length - 1)]
  }));
};

// ── Section 1: students ──────────────────────────────────────────────────────
async function seedStudents(classes) {
  console.log('-- Students (insert-only) ------------------------------------');

  const before = await prisma.student.count();
  const enrollmentsBefore = await prisma.enrollment.count();
  console.log(`  already in the database: ${before} students / ${enrollmentsBefore} enrollments`);

  const roster = assignClasses(STUDENTS, classes);
  let created = 0;
  let skipped = 0;

  for (const s of roster) {
    // Guard: skip anyone already on record — this is what makes a re-run a no-op.
    const existing = await prisma.student.findFirst({
      where: { name: s.name, fatherName: s.fatherName },
      select: { id: true, rollNumber: true }
    });

    if (existing) {
      skipped += 1;
      console.log(`  skipped  ${s.name} — already exists as ${existing.rollNumber}`);
      continue;
    }

    // The class decides the program prefix of the roll number.
    const rollNumber = await generateRollNumber(prisma, {
      program: s.cls.program,
      academicYear: ACADEMIC_YEAR,
      joiningDate: s.joiningDate
    });

    // Default password = the student's own roll number (same convention as the
    // admin "create student" flow in studentController.js).
    const password = await bcrypt.hash(rollNumber, BCRYPT_ROUNDS);

    // One nested create = one transaction: student + enrollment + subjects all
    // land together, or none of them do.
    const student = await prisma.student.create({
      data: {
        rollNumber,
        password,
        email: `${rollNumber.toLowerCase()}@students.cga.edu.pk`,
        name: s.name,
        dateOfBirth: new Date(s.dateOfBirth),
        gender: s.gender,
        address: s.address,
        phone: s.phone,
        fatherName: s.fatherName,
        guardianPhone: s.guardianPhone,
        schoolName: s.schoolName,
        joiningDate: new Date(s.joiningDate),
        academicYear: ACADEMIC_YEAR,
        status: 'ENROLLED',
        enrollment: {
          create: { classId: s.cls.id, monthlyFee: feeForClass(s.cls), isActive: true }
        },
        ...(s.cls.subjects.length > 0 && {
          subjects: {
            createMany: {
              data: s.cls.subjects.map(sub => ({ subjectId: sub.id })),
              skipDuplicates: true
            }
          }
        })
      },
      select: { id: true, name: true, rollNumber: true }
    });

    created += 1;
    console.log(`  created  ${student.rollNumber}  ${student.name.padEnd(18)} -> ${s.cls.name} (fee ${feeForClass(s.cls)}, ${s.cls.subjects.length} subjects)`);
  }

  const after = await prisma.student.count();
  const enrollmentsAfter = await prisma.enrollment.count();

  console.log(`  students: ${before} -> ${after}   enrollments: ${enrollmentsBefore} -> ${enrollmentsAfter}   (created ${created}, skipped ${skipped})`);
  console.log('');

  return { created, skipped, before, after };
}

// ── Section 2: teachers ──────────────────────────────────────────────────────
// Each teacher is created together with their User login in one nested create,
// so a teacher can never end up without a login. Guarded by login email.
async function seedTeachers(classes) {
  console.log('-- Teachers (insert-only) ------------------------------------');

  const before = await prisma.teacher.count();
  console.log(`  already in the database: ${before} teachers`);

  // Attach the existing "Class Teacher" role if the RBAC seed created one.
  // Nothing is written to the role itself — only the new user joins it.
  const teacherRole = await prisma.role.findUnique({ where: { name: 'Class Teacher' }, select: { id: true, name: true } });

  const password = await bcrypt.hash(TEACHER_PASSWORD, BCRYPT_ROUNDS);
  const records = [];
  let created = 0;
  let skipped = 0;

  for (const t of TEACHERS) {
    const existingUser = await prisma.user.findUnique({
      where: { email: t.email },
      select: { id: true, teacher: { select: { id: true, name: true } } }
    });

    if (existingUser?.teacher) {
      skipped += 1;
      records.push({ ...t, id: existingUser.teacher.id });
      console.log(`  skipped  ${t.name} — already exists (${t.email})`);
      continue;
    }

    if (existingUser) {
      // A user with this email exists but is not a teacher — leave it alone.
      skipped += 1;
      console.log(`  skipped  ${t.name} — the email ${t.email} is already taken by another account; not touching it`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: t.email,
        password,
        role: 'TEACHER',
        isVerified: true,
        ...(teacherRole && { roles: { connect: { id: teacherRole.id } } }),
        teacher: {
          create: {
            name: t.name,
            phone: t.phone,
            address: t.address,
            joiningDate: new Date(t.joiningDate),
            tier: t.tier,
            basicSalary: t.basicSalary,
            additionalPay: t.additionalPay
          }
        }
      },
      include: { teacher: { select: { id: true, name: true } } }
    });

    created += 1;
    records.push({ ...t, id: user.teacher.id });
    console.log(`  created  ${t.name.padEnd(24)} ${t.email.padEnd(26)} ${t.tier}, salary ${t.basicSalary}+${t.additionalPay}`);
  }

  // ── Subject assignments (insert-only, duplicates skipped) ──────────────────
  const subjects = [...new Map(
    classes.flatMap(c => c.subjects.map(s => [s.id, s]))
  ).values()];

  const assignments = [];
  for (const t of records) {
    for (const s of subjects) {
      if (t.teaches.includes(s.name)) assignments.push({ teacherId: t.id, subjectId: s.id });
    }
  }

  const { count: assignmentsCreated } = assignments.length
    ? await prisma.subjectTeacher.createMany({ data: assignments, skipDuplicates: true })
    : { count: 0 };

  const after = await prisma.teacher.count();
  console.log(`  teachers: ${before} -> ${after}   (created ${created}, skipped ${skipped})`);
  console.log(`  subject assignments: ${assignmentsCreated} new (${assignments.length - assignmentsCreated} already existed)`);
  console.log('');

  return { created, skipped, before, after, records, assignmentsCreated };
}

// ── Section 3: timetable ─────────────────────────────────────────────────────
// Builds a Mon–Fri timetable for the new teachers, for every class that
// actually has subjects. Two rules are honoured, exactly as the timetable
// controller enforces them:
//   1. a class can have only one slot at a given time,
//   2. a teacher can be in only one class at a given time.
// Any slot that would break either rule — including against timetable rows
// that already exist — is skipped, never overwritten.
async function seedTimetable(classes, teacherRecords) {
  console.log('-- Timetable (insert-only) -----------------------------------');

  const before = await prisma.timetable.count();
  console.log(`  already in the database: ${before} slots`);

  if (teacherRecords.length === 0) {
    console.log('  no seeded teachers available — skipping the timetable.');
    console.log('');
    return { created: 0, skipped: 0, before, after: before };
  }

  // Every existing slot, so both the class grid and teacher clashes are checked
  // against the live data as well as against the slots planned in this run.
  const existing = await prisma.timetable.findMany({
    select: { classId: true, teacherId: true, dayOfWeek: true, startTime: true, endTime: true }
  });

  const booked = existing.map(e => ({ ...e }));
  const planned = [];
  let skipped = 0;

  const teachersFor = (subjectName) => teacherRecords.filter(t => t.teaches.includes(subjectName));

  classes.forEach((cls, classIndex) => {
    if (cls.subjects.length === 0) {
      console.log(`  ${cls.name}: no subjects attached to this class — no slots generated.`);
      return;
    }

    const room = `R-${101 + classIndex}`;
    // Offset the rotation per class, so two classes never ask for the same
    // subject — and therefore the same teacher — in the same period.
    let slotIndex = classIndex;
    let classCreated = 0;

    for (const day of DAYS) {
      for (const period of PERIODS) {
        const subject = cls.subjects[slotIndex % cls.subjects.length];
        slotIndex += 1;

        // Rule 1 — is this class already busy at this time?
        const classBusy = booked.some(b =>
          b.classId === cls.id && b.dayOfWeek === day &&
          overlaps(period.startTime, period.endTime, b.startTime, b.endTime));
        if (classBusy) { skipped += 1; continue; }

        // Rule 2 — pick a teacher for this subject who is free at this time.
        const candidates = teachersFor(subject.name);
        const rotated = candidates.map((_, i) => candidates[(i + slotIndex) % candidates.length]);
        const teacher = rotated.find(t => !booked.some(b =>
          b.teacherId === t.id && b.dayOfWeek === day &&
          overlaps(period.startTime, period.endTime, b.startTime, b.endTime)));

        if (!teacher) { skipped += 1; continue; }

        const slot = {
          classId: cls.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          dayOfWeek: day,
          startTime: period.startTime,
          endTime: period.endTime,
          room
        };

        planned.push(slot);
        booked.push(slot);
        classCreated += 1;
      }
    }

    console.log(`  ${cls.name}: ${classCreated} slots planned (room ${room})`);
  });

  // skipDuplicates covers the @@unique([classId, dayOfWeek, startTime])
  // constraint, so an existing slot is never overwritten.
  const { count: created } = planned.length
    ? await prisma.timetable.createMany({ data: planned, skipDuplicates: true })
    : { count: 0 };

  const after = await prisma.timetable.count();

  // Per-teacher period counts, handy for eyeballing the load.
  const load = teacherRecords.map(t => `${t.name.split(' ').slice(-1)[0]}: ${planned.filter(p => p.teacherId === t.id).length}`);
  console.log(`  slots: ${before} -> ${after}   (created ${created}, skipped ${skipped} — already booked)`);
  if (created > 0) console.log(`  periods per teacher — ${load.join(', ')}`);
  console.log('');

  return { created, skipped, before, after };
}

async function main() {
  console.log('== Seeding students, teachers and timetable (insert-only) =====');
  console.log('');

  const classes = await prisma.class.findMany({
    orderBy: { id: 'asc' },
    include: { subjects: { select: { id: true, name: true, gradeLevel: true } } }
  });

  if (classes.length === 0) {
    throw new Error('No classes found in the database — nothing to enroll students into. Aborting without writing anything.');
  }

  console.log(`Classes found: ${classes.map(c => `${c.name} (${c.program}/${c.gradeLevel}, ${c.subjects.length} subjects)`).join(', ')}`);
  console.log('');

  const students = await seedStudents(classes);
  const teachers = await seedTeachers(classes);
  const timetable = await seedTimetable(classes, teachers.records);

  console.log('-- Summary ---------------------------------------------------');
  console.log(`  students:  ${students.before} -> ${students.after}   (created ${students.created}, skipped ${students.skipped})`);
  console.log(`  teachers:  ${teachers.before} -> ${teachers.after}   (created ${teachers.created}, skipped ${teachers.skipped}, ${teachers.assignmentsCreated} new subject assignments)`);
  console.log(`  timetable: ${timetable.before} -> ${timetable.after}   (created ${timetable.created}, skipped ${timetable.skipped})`);
  if (teachers.created > 0) console.log(`  teacher logins: email above / password "${TEACHER_PASSWORD}"`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
