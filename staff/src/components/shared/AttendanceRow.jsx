import UserAvatar from './UserAvatar'

/**
 * AttendanceRow — one person in a mark-attendance list.
 *
 * Shared by the student and teacher panels so the two screens cannot drift
 * apart. Status is picked with three letter buttons (P / L / A) that fill with
 * their colour when selected; the row itself tints to match.
 *
 * Props:
 *   name          {string}
 *   subtitle      {string|null}  — roll number for students, nothing for teachers
 *   profilePicUrl {string|null}
 *   status        {'PRESENT'|'LEAVE'|'ABSENT'|null}
 *   onChange      {(status) => void}
 *   readOnly      {boolean}      — already saved: shows the status, cannot change it
 */

const OPTIONS = [
  {
    status: 'PRESENT',
    letter: 'P',
    label: 'Present',
    selected: 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600',
  },
  {
    status: 'LEAVE',
    letter: 'L',
    label: 'Leave',
    selected: 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200',
    hover: 'hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600',
  },
  {
    status: 'ABSENT',
    letter: 'A',
    label: 'Absent',
    selected: 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-200',
    hover: 'hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600',
  },
]

const ROW_TINT = {
  PRESENT: 'bg-emerald-50/50 border-emerald-200/60',
  LEAVE: 'bg-amber-50/50 border-amber-200/60',
  ABSENT: 'bg-rose-50/50 border-rose-200/60',
}

export default function AttendanceRow({
  name,
  subtitle = null,
  profilePicUrl = null,
  status = null,
  onChange,
  readOnly = false,
}) {
  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-xl border transition-colors ${
        ROW_TINT[status] || 'bg-card border-border'
      }`}
    >
      <UserAvatar name={name} profilePicUrl={profilePicUrl} size="md" />

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-tight truncate">{name}</p>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground font-mono leading-tight truncate">{subtitle}</p>
        )}
      </div>

      <div className="flex gap-1 sm:gap-1.5 shrink-0">
        {OPTIONS.map(({ status: value, letter, label, selected, hover }) => {
          const active = status === value
          return (
            <button
              key={value}
              type="button"
              disabled={readOnly}
              onClick={() => onChange?.(value)}
              title={label}
              aria-label={label}
              aria-pressed={active}
              className={`h-8 w-8 rounded-full border text-xs font-bold flex items-center justify-center transition-all ${
                active
                  ? selected
                  : `bg-background border-border text-muted-foreground ${readOnly ? 'opacity-50' : hover}`
              } ${readOnly ? 'cursor-default' : ''}`}
            >
              {letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
