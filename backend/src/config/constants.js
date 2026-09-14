// ── Auth ──────────────────────────────────────────────────────────────────────
const REFRESH_TOKEN_EXPIRY_DAYS = 3;
const REFRESH_TOKEN_EXPIRY_MS   = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_EXPIRY_MS     = 60 * 60 * 1000;       // 1 hour
const BCRYPT_ROUNDS      = 12;
const MIN_PASSWORD_LENGTH = 8;
// Constant-time dummy hash to prevent timing-based user enumeration
const DUMMY_BCRYPT_HASH  = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewV20gKMnDlOFNLW';

// ── Salary ────────────────────────────────────────────────────────────────────
// Teacher earns this percentage of collected fee (A-Level programs)
const TEACHER_SHARE_RATE  = 70;
// Multi-program rule: lower band paid at this fraction of its face value
const LOWER_BAND_MULTIPLIER = 0.6;

const PRE_O_LEVEL_BANDS = [
  { minMinutes: 180, salary: 30000 },
  { minMinutes: 150, salary: 25000 },
  { minMinutes: 120, salary: 22000 },
  { minMinutes: 90,  salary: 18000 },
  { minMinutes: 60,  salary: 14000 },
  { minMinutes: 30,  salary: 10000 },
];

const O_LEVEL_BANDS = [
  { minMinutes: 180, salary: 40000 },
  { minMinutes: 150, salary: 35000 },
  { minMinutes: 120, salary: 30000 },
  { minMinutes: 90,  salary: 25000 },
  { minMinutes: 60,  salary: 20000 },
  { minMinutes: 30,  salary: 15000 },
];

// ── Fee / Challans ────────────────────────────────────────────────────────────
const CHALLAN_DUE_DATE_DAY = 15; // Fee challans are due on the 15th of each month

// ── Institution ───────────────────────────────────────────────────────────────
// Configurable per deployment — this codebase is reused across institutes, so
// nothing here should be a literal school name. Bank details are NOT here:
// they're managed at runtime via the PaymentInfo CRUD (see paymentInfoController).
const INSTITUTE_NAME = process.env.INSTITUTE_NAME || 'Al-Hamd Science College';
const INSTITUTE_TAG  = process.env.INSTITUTE_TAG || 'Excellence in Education';

// ── PDF Color Palette ─────────────────────────────────────────────────────────
const NAVY       = '#1a2744';
const NAVY_MID   = '#2a3f6b';
const NAVY_LIGHT = '#3b5998';
const SLATE      = '#475569';
const GRAY       = '#94a3b8';
const GRAY_LIGHT = '#e2e8f0';
const GRAY_BG    = '#f1f5f9';
const WHITE      = '#ffffff';
const RED        = '#dc2626';
const GREEN      = '#16a34a';
const ORANGE     = '#ea580c';
const AMBER_BG   = '#fffbeb';
const AMBER_BD   = '#fde68a';
const AMBER_TXT  = '#92400e';
const EMERALD_BG = '#ecfdf5';
const ROSE_BG    = '#fff1f2';
const ACCENT     = '#c9952b';

module.exports = {
  // Auth
  REFRESH_TOKEN_EXPIRY_DAYS,
  REFRESH_TOKEN_EXPIRY_MS,
  EMAIL_VERIFICATION_EXPIRY_MS,
  PASSWORD_RESET_EXPIRY_MS,
  BCRYPT_ROUNDS,
  MIN_PASSWORD_LENGTH,
  DUMMY_BCRYPT_HASH,
  // Salary
  TEACHER_SHARE_RATE,
  LOWER_BAND_MULTIPLIER,
  PRE_O_LEVEL_BANDS,
  O_LEVEL_BANDS,
  // Fee
  CHALLAN_DUE_DATE_DAY,
  // Institution
  INSTITUTE_NAME,
  INSTITUTE_TAG,
  // PDF Colors
  NAVY, NAVY_MID, NAVY_LIGHT, SLATE, GRAY, GRAY_LIGHT, GRAY_BG, WHITE,
  RED, GREEN, ORANGE, AMBER_BG, AMBER_BD, AMBER_TXT, EMERALD_BG, ROSE_BG, ACCENT,
};
