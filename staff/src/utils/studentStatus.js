// Student status, shared by every screen that shows or picks one.
//
// PASSED_OUT is a terminal state: the student's record — enrollment,
// attendance, challans, marks — is kept in full, but they no longer count as
// an active student and can no longer sign in to the student portal. It is
// also the only status under which the degree hand-over fields are editable.

export const STUDENT_STATUS_OPTIONS = [
    {value: 'ENROLLED', label: 'Enrolled'},
    {value: 'PENDING', label: 'Pending'},
    {value: 'PASSED_OUT', label: 'Passed Out'},
]

export const STATUS_LABEL = {
    ENROLLED: 'Enrolled',
    PENDING: 'Pending',
    PASSED_OUT: 'Passed Out',
}

export const STATUS_BADGE = {
    ENROLLED: 'bg-emerald-50 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 ring-emerald-600/10 dark:ring-emerald-400/20',
    PENDING: 'bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-amber-600/10 dark:ring-amber-400/20',
    PASSED_OUT: 'bg-blue-50 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 ring-blue-600/10 dark:ring-blue-400/20',
}
