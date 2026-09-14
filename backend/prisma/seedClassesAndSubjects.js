const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ── Program → subject map ────────────────────────────────────────────────────
// Based on the standard Pakistani intermediate (Grade 11/12) curriculum:
//   MED (Pre-Medical)    : Biology, Chemistry, Physics
//   ENG (Pre-Engineering): Physics, Chemistry, Mathematics
//   ICS (Computer Science): Physics, Mathematics, Computer Science
//   IT  (Information Technology): Computer Science, Mathematics, Statistics
//   FA  (Faculty of Arts): Economics, Civics, Education
// English, Urdu, Islamiyat and Pakistan Studies are compulsory across every
// program, so they are seeded once per grade level and shared by all classes.
const COMPULSORY_SUBJECTS = ['English', 'Urdu', 'Islamiyat', 'Pakistan Studies'];

const PROGRAM_SUBJECTS = {
  MED: ['Physics', 'Chemistry', 'Biology'],
  ENG: ['Physics', 'Chemistry', 'Mathematics'],
  ICS: ['Physics', 'Mathematics', 'Computer Science'],
  IT: ['Computer Science', 'Mathematics', 'Statistics'],
  FA: ['Economics', 'Civics', 'Education'],
};

const PROGRAMS = Object.keys(PROGRAM_SUBJECTS);
const GRADE_LEVELS = ['GRADE_11', 'GRADE_12'];

async function main() {
  console.log('Seeding classes and subjects...');

  // ── Classes: one per (program, gradeLevel) ─────────────────────────────────
  const classes = {}; // 'PROGRAM::GRADE' → MorningClass
  for (const program of PROGRAMS) {
    for (const gradeLevel of GRADE_LEVELS) {
      const gradeSuffix = gradeLevel === 'GRADE_11' ? '11' : '12';
      const name = `${program}-${gradeSuffix}`;
      const cls = await prisma.morningClass.upsert({
        where: { name },
        update: { gradeLevel, program },
        create: { name, gradeLevel, program },
      });
      classes[`${program}::${gradeLevel}`] = cls;
    }
  }
  console.log(`✓ Classes: ${Object.keys(classes).length} (${PROGRAMS.length} programs × ${GRADE_LEVELS.length} grade levels)`);

  // ── Subjects: create/reuse per (name, gradeLevel), connect to every class
  // of that grade level that teaches it. A subject shared by 2+ programs
  // (e.g. Physics in MED/ENG/ICS, Mathematics in ENG/ICS/IT) is created once
  // per grade level and linked to every relevant class.
  let subjectCount = 0;
  const subjectsByGradeName = {}; // 'GRADE::name' → MorningSubject

  for (const gradeLevel of GRADE_LEVELS) {
    // Build name → [classIds] for this grade level across compulsory + program subjects
    const classIdsByName = {};
    const addClass = (name, classId) => {
      if (!classIdsByName[name]) classIdsByName[name] = new Set();
      classIdsByName[name].add(classId);
    };

    for (const program of PROGRAMS) {
      const cls = classes[`${program}::${gradeLevel}`];
      for (const name of COMPULSORY_SUBJECTS) addClass(name, cls.id);
      for (const name of PROGRAM_SUBJECTS[program]) addClass(name, cls.id);
    }

    for (const [name, classIdSet] of Object.entries(classIdsByName)) {
      const classConnections = [...classIdSet].map(id => ({ id }));
      const subject = await prisma.morningSubject.upsert({
        where: { name_gradeLevel: { name, gradeLevel } },
        update: { classes: { set: classConnections } },
        create: { name, gradeLevel, classes: { connect: classConnections } },
      });
      subjectsByGradeName[`${gradeLevel}::${name}`] = subject;
      subjectCount++;
    }
  }
  console.log(`✓ Subjects: ${subjectCount} (shared across programs where applicable)`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n── Classes & Subjects seed complete ──────────────────────────');
  for (const gradeLevel of GRADE_LEVELS) {
    console.log(`  ${gradeLevel}:`);
    for (const program of PROGRAMS) {
      const subs = [...COMPULSORY_SUBJECTS, ...PROGRAM_SUBJECTS[program]];
      console.log(`    ${program}-${gradeLevel === 'GRADE_11' ? '11' : '12'}: ${subs.join(', ')}`);
    }
  }
  console.log('────────────────────────────────────────────────────────────────');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
