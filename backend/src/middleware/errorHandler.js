const AppError = require('../utils/AppError');

// ── Prisma error normalisation ────────────────────────────────────────────────

const handlePrismaError = (err) => {
  // Unique constraint violation
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] ?? 'field';
    return new AppError(409, { [field]: `${field} already exists` });
  }

  // Record not found
  if (err.code === 'P2025') {
    const cause = err.meta?.cause ?? 'Record not found';
    return new AppError(404, { message: cause });
  }

  // Foreign key constraint failed
  if (err.code === 'P2003') {
    const field = err.meta?.field_name ?? 'reference';
    return new AppError(400, { [field]: 'Referenced record does not exist' });
  }

  // Required field missing at DB level
  if (err.code === 'P2011') {
    const field = err.meta?.constraint ?? 'field';
    return new AppError(400, { [field]: 'This field is required' });
  }

  return new AppError(500, { message: 'Database error' });
};

// ── Global error handler ──────────────────────────────────────────────────────

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Prisma known request errors
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }
  // Prisma validation errors (wrong types sent to Prisma)
  else if (err.constructor?.name === 'PrismaClientValidationError') {
    if (process.env.NODE_ENV !== 'production') console.error('PrismaClientValidationError:', err.message);
    error = new AppError(400, { message: 'Invalid data supplied to the database' });
  }
  // JWT errors (fallback – normally caught in auth middleware)
  else if (err.name === 'JsonWebTokenError') {
    error = new AppError(401, { token: 'Invalid token' });
  }
  else if (err.name === 'TokenExpiredError') {
    error = new AppError(401, { token: 'Token has expired' });
  }

  // Unknown / programmer errors → generic 500, log the full stack
  if (!(error instanceof AppError)) {
    console.error('UNHANDLED ERROR:', err);
    error = new AppError(500, {
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  } else if (process.env.NODE_ENV === 'development') {
    // Still log operational errors in dev for visibility
    console.error(`[${error.statusCode}]`, error.message);
  }

  const body = { errors: error.errors };
  if (error.code) body.code = error.code;
  res.status(error.statusCode).json(body);
};

module.exports = errorHandler;
