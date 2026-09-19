// ── Roll numbers ──────────────────────────────────────────────────────────────
// Format: PROGRAM + YY - SERIAL  (e.g. ICS26-001, MED26-002, IT26-003).
// The serial is a single counter per enrollment year shared by every program,
// drawn from RollNumberSequence so concurrent admissions can never collide.

const SERIAL_PAD = 3;
const FALLBACK_PREFIX = 'GEN';
const MAX_ATTEMPTS = 25;

// Enrollment year: the academic year the student is admitted into
// ("2026-2028" -> 2026), falling back to the joining date, then today.
const resolveEnrollmentYear = ({ academicYear, joiningDate } = {}) => {
  const match = /^(\d{4})/.exec(String(academicYear || ''));
  if (match) return parseInt(match[1], 10);

  if (joiningDate) {
    const parsed = new Date(joiningDate);
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();
  }

  return new Date().getFullYear();
};

// Atomically claim the next serial for the year. The upsert compiles to a
// single INSERT ... ON CONFLICT DO UPDATE, so two simultaneous admissions get
// two different numbers instead of both reading the same count.
const claimNextSerial = async (prisma, year) => {
  const { lastSerial } = await prisma.rollNumberSequence.upsert({
    where: { year },
    create: { year, lastSerial: 1 },
    update: { lastSerial: { increment: 1 } },
    select: { lastSerial: true }
  });

  return lastSerial;
};

const formatRollNumber = (program, year, serial) =>
  `${String(program || FALLBACK_PREFIX).toUpperCase()}${String(year).slice(-2)}-${String(serial).padStart(SERIAL_PAD, '0')}`;

// What the next roll number will look like, WITHOUT consuming a serial.
// Purely for showing the admin a preview while they fill the form — the real
// number is claimed at save time, so this can go stale and that is fine.
const peekRollNumber = async (prisma, { program, academicYear, joiningDate } = {}) => {
  const year = resolveEnrollmentYear({ academicYear, joiningDate });

  const sequence = await prisma.rollNumberSequence.findUnique({
    where: { year },
    select: { lastSerial: true }
  });

  let serial = (sequence?.lastSerial ?? 0) + 1;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const rollNumber = formatRollNumber(program, year, serial);
    const taken = await prisma.student.findUnique({ where: { rollNumber }, select: { id: true } });
    if (!taken) return rollNumber;
    serial += 1;
  }

  return null;
};

const generateRollNumber = async (prisma, { program, academicYear, joiningDate } = {}) => {
  const year = resolveEnrollmentYear({ academicYear, joiningDate });

  // The counter alone guarantees uniqueness for generated numbers, but an admin
  // may have typed a matching one by hand — skip past any serial already taken.
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const rollNumber = formatRollNumber(program, year, await claimNextSerial(prisma, year));
    const taken = await prisma.student.findUnique({ where: { rollNumber }, select: { id: true } });
    if (!taken) return rollNumber;
  }

  throw new Error(`Could not allocate a unique roll number for ${year} after ${MAX_ATTEMPTS} attempts.`);
};

const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

const calculateAttendancePercentage = (attendances) => {
  if (!attendances || attendances.length === 0) return 0;

  const presentCount = attendances.filter(
    a => a.status === 'PRESENT'
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
  peekRollNumber,
  formatRollNumber,
  resolveEnrollmentYear,
  formatDate,
  calculateAttendancePercentage,
  parseId,
  parseIds
};
