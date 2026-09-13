const generateRollNumber = async (prisma) => {
  const currentYear = new Date().getFullYear();
  const yearSuffix = String(currentYear).slice(-2); // Get last 2 digits (e.g., 26 from 2026)

  // Get count of students registered this year
  const count = await prisma.student.count({
    where: {
      registrationDate: {
        gte: new Date(`${currentYear}-01-01`),
        lt: new Date(`${currentYear + 1}-01-01`)
      }
    }
  });

  // Format: XXXX-YYYY (e.g., 0001-2026)
  const rollNumber = `${String(count + 1).padStart(4, '0')}-${currentYear}`;

  return rollNumber;
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const calculateAttendancePercentage = (attendances) => {
  if (!attendances || attendances.length === 0) return 0;

  const presentCount = attendances.filter(
    a => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;

  return Math.round((presentCount / attendances.length) * 100);
};

// Parse a single value to a valid integer, returns NaN if invalid
const parseId = (value) => parseInt(value, 10);

// Parse an array of values to integers, filtering out any NaN results
const parseIds = (values) =>
  (Array.isArray(values) ? values : [])
    .map(v => parseInt(v, 10))
    .filter(id => !isNaN(id));

module.exports = {
  generateRollNumber,
  formatDate,
  calculateAttendancePercentage,
  parseId,
  parseIds
};
