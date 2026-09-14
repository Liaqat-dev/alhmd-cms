require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const studentId = 1; // Ali Ahmed, enrolled in ICS-11 (classId=7)
  const subs = await prisma.morningStudentSubject.findMany({
    where: { studentId },
    include: { subject: { select: { name: true } } },
  });
  console.log('MorningStudentSubject rows for studentId=1:');
  subs.forEach(s => console.log(`  subjectId=${s.subjectId} (${s.subject?.name})`));

  const classSubjects = await prisma.morningClass.findUnique({
    where: { id: 7 },
    include: { subjects: { select: { id: true, name: true } } },
  });
  console.log('\nSubjects belonging to class ICS-11 (id=7):');
  classSubjects.subjects.forEach(s => console.log(`  id=${s.id} ${s.name}`));

  await prisma.$disconnect();
})();
