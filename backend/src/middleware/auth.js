const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const catchAsync = require('../utils/catchAsync');

// Auth middleware: verify Bearer token and attach req.user
//
// Token payload is `{ id, role }`. For ADMIN/TEACHER, `id` is a User.id.
// For STUDENT, `id` is a Student.id — students are no longer backed by a
// User account, so they're looked up directly in the Student table.
//
// Either way, req.user ends up with the same shape controllers already
// expect: { id, role, email, admin?, teacher?, student? }.
//
// The inner jwt.verify try/catch is intentional: it differentiates
// TokenExpiredError (→ 401 + TOKEN_EXPIRED) from other JWT errors (→ 401 +
// INVALID_TOKEN) so the frontend can trigger a silent refresh vs. a full
// logout. Unexpected errors (DB failures, etc.) propagate to catchAsync →
// global error handler.
const auth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided', code: 'NO_TOKEN' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Invalid token', code: 'INVALID_TOKEN' });
  }

  if (decoded.role === 'STUDENT') {
    const student = await prisma.student.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, rollNumber: true, email: true, status: true },
    });

    if (!student) {
      return res.status(401).json({ message: 'Student not found', code: 'USER_NOT_FOUND' });
    }

    // Graduating a student ends their portal access immediately, even if they
    // are holding an access token that hasn't expired yet. 401 (not 403) so the
    // frontend runs its usual refresh-then-logout path.
    if (student.status === 'GRADUATED') {
      return res.status(401).json({ message: 'Account is no longer active', code: 'ACCOUNT_GRADUATED' });
    }

    req.user = { id: student.id, role: 'STUDENT', email: student.email, student };
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      role: true,
      isVerified: true,
      createdAt: true,
      admin:   { select: { id: true, name: true } },
      teacher: { select: { id: true, name: true } },
    },
  });

  if (!user) {
    return res.status(401).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
  }

  // Block access if email exists but not yet verified
  if (user.email && !user.isVerified) {
    return res.status(403).json({ message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' });
  }

  req.user = user;
  return next();
});

module.exports = auth;
