/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's next(err), eliminating repetitive try/catch blocks.
 *
 * Usage:
 *   router.get('/', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
