/**
 * AttendanceChart — attendance over the last 7 days, as 100% stacked columns.
 *
 * Shared by the admin and teacher dashboards: the caller supplies the data and
 * the card chrome, so each page keeps its own surface.
 *
 * Colour is doing a *status* job here, not an identity one, so the three fills
 * come from the fixed status palette (good / warning / critical) rather than a
 * categorical ramp. Validated against both surfaces this renders on: worst
 * adjacent CVD ΔE 11.3 (target ≥8), normal-vision ΔE 27.6 (floor ≥15). Amber
 * sits under 3:1 on the light surface by design, which is why identity never
 * rests on hue alone — the legend spells out every series and carries its week
 * total, and the tooltip gives exact counts.
 *
 * A day nobody marked is drawn as an empty track, not a 0% bar. The two are
 * completely different facts and the old attendance card conflated them.
 */

import {useEffect, useRef, useState} from 'react'
import {Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue} from '@/components/ui/select'
import {cn} from '@/lib/utils'

// Status palette — fixed, never themed. Same steps in both modes; all three
// clear 3:1 on the dark surface, and the light-mode amber leans on the legend
// label + tooltip rather than on its hue.
const SERIES = [
    {key: 'present', label: 'Present', fill: '#0ca30c', ink: '#ffffff'},
    {key: 'leave', label: 'Leave', fill: '#fab219', ink: '#3d2a00'},
    {key: 'absent', label: 'Absent', fill: '#d03b3b', ink: '#ffffff'},
]

const PLOT_HEIGHT = 208          // px of plot area, excluding the x-axis band
const AXIS_WIDTH = 36            // the y-axis tick gutter (w-9)
const BAND_WIDTH = 112           // per-day slot; the bar sits centred in it
const BAND_GAP = 8               // gap-2 between day slots

// Bars deliberately run wider than the 24px the viz guidance caps marks at.
// With only the taught days on screen — often two — a 24px column read as a
// hairline lost in the card, so width was raised by request. The band above
// keeps air around each one so they still read as marks, not blocks.
const TICKS = [100, 75, 50, 25, 0]
const SEGMENT_GAP = 2            // surface gap between stacked fills
const AXIS_BAND = 40             // weekday + date under the plot
const MIN_LABEL_HEIGHT = 16      // 12px text in a 16px line-box: the smallest
                                 // slice that can hold its figure without clipping.
                                 // Thinner than this (under ~8% of the bar) the
                                 // figure stays in the tooltip, which is now
                                 // reachable by tap as well as hover.

function Tooltip({day}) {
    const pct = (n) => day.total ? Math.round((n / day.total) * 100) : 0
    return (
        <div className={cn(
            'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-max -translate-x-1/2',
            'rounded-lg border border-gray-200 dark:border-dark-700',
            'bg-white dark:bg-dark-900 px-3 py-2 shadow-lg'
        )}>
            <p className="text-xs font-semibold text-gray-800 dark:text-dark-100">
                {day.day}
                <span className="ml-1.5 font-normal text-gray-400 dark:text-dark-500">
                    {new Date(day.date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'})}
                </span>
            </p>
            {day.marked ? (
                <div className="mt-1.5 space-y-1">
                    {SERIES.map(s => (
                        <div key={s.key} className="flex items-center gap-2 text-xs">
                            <span className="h-2 w-2 shrink-0 rounded-sm" style={{backgroundColor: s.fill}}/>
                            <span className="text-gray-500 dark:text-dark-400">{s.label}</span>
                            <span className="ml-auto pl-3 font-semibold tabular-nums text-gray-800 dark:text-dark-100">
                                {day[s.key]}
                                <span className="ml-1 font-normal text-gray-400 dark:text-dark-500">
                                    {pct(day[s.key])}%
                                </span>
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-1 text-xs text-gray-400 dark:text-dark-500">Attendance not marked</p>
            )}
        </div>
    )
}

function Column({day, active, dimmed, onHover, onLeave, onToggle}) {
    // Segments stack bottom-up: present, then leave, then absent on top. Only
    // non-zero slices are drawn, so an empty amber sliver never appears.
    const present = day.marked
        ? SERIES.map(s => ({...s, value: day[s.key]})).filter(s => s.value > 0)
        : []
    // The gaps are drawn from the plot's own height, not added on top of it,
    // so a stack of three still ends exactly on the 100% line.
    const usable = PLOT_HEIGHT - (Math.max(present.length - 1, 0) * SEGMENT_GAP)
    const slices = present.map(s => ({...s, height: (s.value / day.total) * usable}))

    // Read out by screen readers, so the figures are not locked behind a pointer.
    const summary = day.marked
        ? day.day + ': ' + SERIES.map(x => x.label + ' ' + day[x.key]).join(', ')
        : day.day + ': attendance not marked'

    return (
        <div
            className={cn(
                'group relative flex flex-1 flex-col items-center',
                // Tap works the same as hover — on Android there is no hover to
                // give, so the tooltip has to be reachable by touch.
                'cursor-pointer select-none touch-manipulation',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded'
            )}
            role="button"
            tabIndex={0}
            aria-label={summary}
            aria-pressed={active}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onToggle}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
                if (e.key === 'Escape') onLeave()
            }}
        >
            {active && <Tooltip day={day}/>}

            <div className="flex w-full justify-center" style={{height: PLOT_HEIGHT}}>
                {day.marked ? (
                    <div className="flex w-full max-w-10 sm:max-w-14 lg:max-w-20 flex-col-reverse" style={{gap: SEGMENT_GAP}}>
                        {slices.map((s, i) => (
                            <div
                                key={s.key}
                                className={cn(
                                    'w-full transition-opacity duration-150',
                                    // 4px rounded data-end on the topmost slice only;
                                    // the stack stays square where it meets the baseline.
                                    i === slices.length - 1 && 'rounded-t',
                                    dimmed && 'opacity-60'
                                )}
                                style={{
                                    backgroundColor: s.fill,
                                    height: Math.max(s.height, 1),
                                }}
                            >
                                {/* Every segment carries its own percentage, but only
                                    when the slice is genuinely tall enough — a clipped
                                    label is worse than none, and a thin sliver keeps
                                    its figure in the tooltip instead. */}
                                {s.height >= MIN_LABEL_HEIGHT && (
                                    <span
                                        className="flex h-full items-center justify-center text-xs font-semibold tabular-nums"
                                        style={{color: s.ink}}
                                    >
                                        {Math.round((s.value / day.total) * 100)}%
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    // Not marked — an empty track, visibly different from 0% present.
                    <div className="flex w-full max-w-10 sm:max-w-14 lg:max-w-20 items-end justify-center">
                        <div className="h-full w-full rounded-t border border-dashed border-gray-200 bg-gray-50/60 dark:border-dark-700 dark:bg-dark-800/40"/>
                    </div>
                )}
            </div>

            <span className={cn(
                'mt-2 flex flex-col items-center leading-tight',
                active ? 'font-semibold text-gray-700 dark:text-dark-200' : 'text-gray-400 dark:text-dark-500'
            )}>
                <span className="text-xs">{day.day}</span>
                <span className="text-[10px] tabular-nums opacity-80">
                    {new Date(day.date).getDate()}
                </span>
            </span>
        </div>
    )
}

export const ALL_CLASSES = 'all'

// Grade scopes carry the GradeLevel enum spelling end to end, so the dropdown
// value is the API value is the column value.
const GRADE_SCOPES = [
    {value: 'GRADE_11', label: 'Grade 11'},
    {value: 'GRADE_12', label: 'Grade 12'},
]

export default function AttendanceChart({days = [], classes = [], classId, scopeLabel, scopeClassCount, daysFromTimetable = true, onClassChange, loading}) {
    const [hovered, setHovered] = useState(null)
    // A tapped column pins its tooltip open; hover alone is not available on
    // touch, and a tooltip that vanishes on lift is unreadable.
    const [pinned, setPinned] = useState(null)
    const plotRef = useRef(null)

    // Tapping anywhere outside the plot puts it away again. pointerdown covers
    // mouse, touch and pen in one listener.
    useEffect(() => {
        if (!pinned) return
        const dismiss = (e) => {
            if (plotRef.current && !plotRef.current.contains(e.target)) {
                setPinned(null)
                // Some Android browsers synthesise a mouseenter on tap; clear it
                // too or the tooltip lingers after the pin is gone.
                setHovered(null)
            }
        }
        document.addEventListener('pointerdown', dismiss)
        return () => document.removeEventListener('pointerdown', dismiss)
    }, [pinned])

    // Switching class or week must not leave a tooltip pinned to a day that is
    // no longer on screen.
    useEffect(() => { setPinned(null); setHovered(null) }, [classId, days])

    // Only offer a grade that actually has classes behind it — an option that
    // can only ever draw an empty chart is worse than no option.
    const grades = GRADE_SCOPES.filter(g => classes.some(c => c.gradeLevel === g.value))

    // The window is the last 7 days; the columns are that window's teaching
    // days, so the subtitle counts them rather than naming a span.
    const dayRange = days.length === 1
        ? 'the 1 teaching day in the last 7'
        : `the ${days.length} teaching days in the last 7`
    const isGroup = classId === ALL_CLASSES || GRADE_SCOPES.some(g => g.value === classId)

    // Legend doubles as the week's totals, which is what keeps every value
    // visible without printing a number on every segment.
    const totals = SERIES.map(s => ({
        ...s,
        total: days.reduce((sum, d) => sum + (d[s.key] || 0), 0),
    }))
    const anyMarked = days.some(d => d.marked)

    return (
        <div>
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-gray-400 dark:text-dark-500">
                        {isGroup
                            ? `${scopeClassCount ?? 0} ${scopeClassCount === 1 ? 'class' : 'classes'} combined, ${dayRange}`
                            : `Share of students by status, ${dayRange}`}
                    </p>
                </div>
                {classes.length > 0 && (
                    <Select value={classId ? String(classId) : ''} onValueChange={onClassChange}>
                        <SelectTrigger className="h-8 w-32 shrink-0 text-xs">
                            <SelectValue placeholder="Class"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
                            {grades.map(g => (
                                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                            ))}
                            <SelectSeparator/>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center" style={{height: PLOT_HEIGHT + AXIS_BAND}}>
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500/20 border-t-primary-500"/>
                </div>
            ) : days.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2" style={{height: PLOT_HEIGHT + AXIS_BAND}}>
                    <p className="text-sm text-gray-400 dark:text-dark-500">No class to show yet</p>
                </div>
            ) : (
                <>
                    <div
                        className="mx-auto flex"
                        style={{maxWidth: AXIS_WIDTH + days.length * BAND_WIDTH + (days.length - 1) * BAND_GAP}}
                    >
                        {/* Y axis — percentage ticks, hairline solid gridlines */}
                        <div className="relative w-9 shrink-0" style={{height: PLOT_HEIGHT}}>
                            {TICKS.map(t => (
                                <span
                                    key={t}
                                    className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-gray-400 dark:text-dark-500"
                                    style={{top: `${100 - t}%`}}
                                >
                                    {t}%
                                </span>
                            ))}
                        </div>

                        <div className="relative flex-1">
                            <div className="absolute inset-0" style={{height: PLOT_HEIGHT}}>
                                {TICKS.map(t => (
                                    <div
                                        key={t}
                                        className="absolute inset-x-0 border-t border-gray-100 dark:border-dark-800"
                                        style={{top: `${100 - t}%`}}
                                    />
                                ))}
                            </div>
                            <div className="relative flex gap-2" ref={plotRef}>
                                {days.map(d => {
                                    // A pin beats a hover, so a tapped column does not
                                    // flicker when the pointer drifts across its neighbour.
                                    const shown = pinned ?? hovered
                                    return (
                                        <Column
                                            key={d.day}
                                            day={d}
                                            active={shown === d.day}
                                            dimmed={shown !== null && shown !== d.day}
                                            onHover={() => setHovered(d.day)}
                                            onLeave={() => { setHovered(null); setPinned(null) }}
                                            onToggle={() => setPinned(p => (p === d.day ? null : d.day))}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Legend — always present for 3 series, and carrying the week's
                        totals so no value depends on reading a colour. */}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 dark:border-dark-800">
                        {totals.map(s => (
                            <span key={s.key} className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor: s.fill}}/>
                                <span className="text-xs text-gray-500 dark:text-dark-400">{s.label}</span>
                                <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-dark-200">
                                    {s.total}
                                </span>
                            </span>
                        ))}
                    </div>

                    {!daysFromTimetable && (
                        <p className="mt-2 text-center text-xs text-amber-600 dark:text-amber-400">
                            No timetable set for this scope — showing every day of the last 7.
                        </p>
                    )}

                    {!anyMarked && (
                        <p className="mt-2 text-center text-xs text-gray-400 dark:text-dark-500">
                            {scopeClassCount === 0
                                ? `No classes in ${scopeLabel || 'this scope'} yet.`
                                : isGroup
                                    ? `Nothing marked for ${scopeLabel || 'any class'} in the last 7 days.`
                                    : 'Nothing marked for this class in the last 7 days.'}
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
