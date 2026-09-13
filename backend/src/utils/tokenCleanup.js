const prisma = require('../lib/prisma');

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Hard-deletes refresh tokens that can never be valid again: expired ones and
// any that were revoked (rotated out, logged out, password reset, etc.).
// Refresh tokens rotate on every access-token refresh, so without this the
// table grows unbounded with dead rows.
const cleanupRefreshTokens = async () => {
  const now = new Date();
  const result = await prisma.refreshToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: now } }, { isRevoked: true }] }
  });
  if (result.count > 0) {
    console.log(`[Token cleanup] Deleted ${result.count} expired/revoked refresh token(s)`);
  }
  return result.count;
};

// Runs the cleanup once at startup, then every 24 hours.
const scheduleRefreshTokenCleanup = () => {
  const run = () => cleanupRefreshTokens().catch(err =>
    console.warn('[Token cleanup] Failed:', err.message)
  );
  run(); // clear any backlog on boot
  setInterval(run, CLEANUP_INTERVAL_MS);
};

module.exports = { cleanupRefreshTokens, scheduleRefreshTokenCleanup };
