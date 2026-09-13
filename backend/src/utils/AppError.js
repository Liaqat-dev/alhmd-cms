/**
 * Operational (expected) error that carries a structured errors object.
 *
 * Usage:
 *   // Field-level errors (validation, uniqueness, etc.)
 *   throw new AppError(400, { email: 'Invalid email', password: 'Too short' });
 *
 *   // General (non-field) error
 *   throw new AppError(404, 'Student not found');
 *   // → { errors: { message: 'Student not found' } }
 */
class AppError extends Error {
  /**
   * @param {number}        statusCode  HTTP status code
   * @param {string|Object} errors      Field→message map, or a plain string message
   * @param {string}        [code]      Optional machine-readable error code (e.g. 'TOKEN_EXPIRED')
   */
  constructor(statusCode, errors, code) {
    const message = typeof errors === 'string' ? errors : 'An error occurred';
    super(message);

    this.statusCode = statusCode;
    this.errors = typeof errors === 'string' ? { message: errors } : errors;
    this.isOperational = true;
    if (code) this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
