require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const now = new Date();
  console.log('Server now:', now.toString());
  console.log('Server now (ISO/UTC):', now.toISOString());
  console.log('getDay():', now.getDay());

  const tuesdayEntries = await prisma.morningTimetable.findMany({
    where: { dayOfWeek: 'TUESDAY' },
    include: { morningClass: { select: { id: true, name: true } }, subject: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('\nTUESDAY timetable entries (most recent 10):');
  tuesdayEntries.forEach(e => console.log(`  id=${e.id} class=${e.morningClass?.name}(${e.morningClassId}) subject=${e.subject?.name} ${e.startTime}-${e.endTime} createdAt=${e.createdAt}`));

  console.log('\nRecent MorningEnrollments (10):');
  const enrollments = await prisma.morningEnrollment.findMany({
    take: 10,
    orderBy: { enrolledAt: 'desc' },
    include: { morningClass: { select: { id: true, name: true } }, student: { select: { name: true } } },
  });
  enrollments.forEach(e => console.log(`  studentId=${e.studentId} (${e.student?.name}) classId=${e.morningClassId}(${e.morningClass?.name}) isActive=${e.isActive}`));

  await prisma.$disconnect();
})();
