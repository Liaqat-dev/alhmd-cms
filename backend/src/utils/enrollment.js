// The definition of "currently enrolled", shared by every count that an admin
// reads as a student total.
//
// Graduating a student retires their enrollment (`isActive: false`), so the
// flag alone is usually enough. Pairing it with the status check is what makes
// the exclusion guaranteed rather than incidental — a graduate whose
// enrollment was re-activated by some other edit still never counts as active.
const ACTIVE_ENROLLMENT = { isActive: true, student: { status: { not: 'GRADUATED' } } };

module.exports = { ACTIVE_ENROLLMENT };
