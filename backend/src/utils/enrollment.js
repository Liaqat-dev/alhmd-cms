// The definition of "currently enrolled", shared by every count that an admin
// reads as a student total.
//
// Passing a student out retires their enrollment (`isActive: false`), so the
// flag alone is usually enough. Pairing it with the status check is what makes
// the exclusion guaranteed rather than incidental — a passed-out student whose
// enrollment was re-activated by some other edit still never counts as active.
const ACTIVE_ENROLLMENT = { isActive: true, student: { status: { not: 'PASSED_OUT' } } };

module.exports = { ACTIVE_ENROLLMENT };
