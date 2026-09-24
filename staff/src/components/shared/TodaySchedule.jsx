/**
 * TodaySchedule — the teaching periods for one day, as a time rail.
 *
 * Read-only: it says what is being taught and when, nothing more. Marking
 * attendance belongs to the attendance screens, not to a schedule.
 *
 * Styled with the same tokens as the admin dashboard so the two pages read as
 * one product.
 */

import { Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

// "HH:MM" compares correctly as a string, which is also how the timetable
// stores it — no parsing, no timezone to get wrong.
const nowHHMM = () => {
  const d = new Date()
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

const statusOf = (entry, now) => {
  if (entry.endTime <= now) return 'done'
  if (entry.startTime <= now) return 'now'
  return 'upcoming'
}

function Period({ entry, status, isNext, isLast }) {
  const live = status === 'now'
  const done = status === 'done'

  return (
    <li className="flex gap-3">
      <div className="flex w-12 shrink-0 flex-col items-end pt-0.5">
        <span className={cn(
          'text-sm tabular-nums leading-none',
          live ? 'font-semibold text-gray-800 dark:text-dark-100' : 'text-gray-500 dark:text-dark-400'
        )}>
          {entry.startTime}
        </span>
        <span className="mt-1 text-[11px] tabular-nums leading-none text-gray-400 dark:text-dark-500">
          {entry.endTime}
        </span>
      </div>

      {/* The rail — a hairline threading each period's marker. */}
      <div className="relative flex w-3 shrink-0 justify-center">
        {!isLast && (
          <span className="absolute bottom-0 top-3 w-px bg-gray-100 dark:bg-dark-800" aria-hidden="true" />
        )}
        <span
          className={cn(
            'relative z-10 mt-1.5 h-2 w-2 rounded-full',
            live ? 'bg-primary-500' : 'bg-gray-200 dark:bg-dark-700'
          )}
          aria-hidden="true"
        />
      </div>

      <div className={cn(
        'mb-3 flex flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5',
        live
          ? 'border-primary-500/25 bg-primary-500/[0.06] dark:border-primary-500/30 dark:bg-primary-500/10'
          : 'border-gray-100 bg-gray-50/50 dark:border-dark-800 dark:bg-dark-800/30',
        done && 'opacity-60'
      )}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight text-gray-800 dark:text-dark-100">
            {entry.subject?.name || 'Lecture'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-400 dark:text-dark-500">
            <span className="truncate">{entry.class?.name}</span>
            {entry.room && (
              <>
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{entry.room}</span>
              </>
            )}
          </p>
        </div>

        {(live || isNext) && (
          <span className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
            live
              ? 'bg-primary-500/10 text-primary-600 ring-primary-500/20 dark:text-primary-400'
              : 'bg-gray-100 text-gray-500 ring-gray-200 dark:bg-dark-800 dark:text-dark-400 dark:ring-dark-700'
          )}>
            {live ? 'Now' : 'Next'}
          </span>
        )}
      </div>
    </li>
  )
}

export default function TodaySchedule({ entries = [], loading }) {
  const now = nowHHMM()
  const ordered = [...entries].sort((a, b) => a.startTime.localeCompare(b.startTime))
  const statuses = ordered.map(e => statusOf(e, now))
  // The first period still to come. Shown even while one is live — "what am I
  // teaching after this" is the question being asked mid-period.
  const nextIndex = statuses.indexOf('upcoming')

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex gap-3">
            <div className="h-4 w-12 shrink-0 animate-pulse rounded bg-gray-100 dark:bg-dark-800" />
            <div className="h-12 flex-1 animate-pulse rounded-xl bg-gray-100 dark:bg-dark-800" />
          </div>
        ))}
      </div>
    )
  }

  if (ordered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-800">
          <Clock className="h-5 w-5 text-gray-400 dark:text-dark-500" />
        </div>
        <p className="text-sm text-gray-400 dark:text-dark-500">No classes scheduled today</p>
      </div>
    )
  }

  return (
    <ol className="list-none">
      {ordered.map((entry, i) => (
        <Period
          key={entry.id}
          entry={entry}
          status={statuses[i]}
          isNext={i === nextIndex}
          isLast={i === ordered.length - 1}
        />
      ))}
    </ol>
  )
}
