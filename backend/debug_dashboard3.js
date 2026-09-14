require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const studentId = 1;
  const now = new Date();
  const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDayOfWeek = daysOfWeek[now.getDay()];
  console.log('todayDayOfWeek:', todayDayOfWeek);

  const mainEnrollment = await prisma.morningEnrollment.findUnique({
    where: { studentId },
    include: { morningClass: { include: { subjects: { select: { id: true, name: true } } } } },
  });
  console.log('mainEnrollment:', JSON.stringify(mainEnrollment, null, 2));

  const classIds = [mainEnrollment].map(e => e.morningClassId).filter(Boolean);
  console.log('classIds:', classIds);

  const timetableEntries = await prisma.morningTimetable.findMany({
    where: { morningClassId: { in: classIds }, dayOfWeek: todayDayOfWeek },
    include: { subject: true, teacher: true, morningClass: true },
    orderBy: { startTime: 'asc' },
  });
  console.log('timetableEntries count:', timetableEntries.length);
  timetableEntries.forEach(e => console.log(' ', e.id, e.subject.name, e.startTime, e.endTime));

  await prisma.$disconnect();
})();
