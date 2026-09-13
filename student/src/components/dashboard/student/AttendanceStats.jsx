import { BookOpen, BarChart3 } from 'lucide-react'

/* ── Overall summary bar ─────────────────────────────────────── */
function OverallSummary({ stats }) {
    if (!stats) return null
    const { present = 0, absent = 0, leave = 0, total = 0 } = stats
    if (total === 0) return null

    const items = [
        { label: 'Present', value: present, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Leave', value: leave, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
        { label: 'Absent', value: absent, color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' },
    ]

    return (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Monthly Overview
                </p>
                <span className="text-xs text-muted-foreground tabular-nums">{total} classes</span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px]">
                {items.map(item => (
                    item.value > 0 && (
                        <div
                            key={item.label}
                            className={`${item.color} rounded-full transition-all duration-700`}
                            style={{ width: `${(item.value / total) * 100}%` }}
                        />
                    )
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {items.map(item => (
                    <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${item.color}`} />
                        {item.label}&nbsp;
                        <span className={`font-bold tabular-nums cga-num ${item.textColor}`}>{item.value}</span>
                    </span>
                ))}
            </div>
        </div>
    )
}

/* ── Main component ──────────────────────────────────────────── */
export default function AttendanceStats({ month, year, overallStats }) {
    const display = month && year ? `${month} ${year}` : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const hasData = !!overallStats && overallStats.total > 0
    const avg = hasData ? overallStats.percentage : 0

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <BarChart3 className="h-4 w-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="cga-display text-lg font-bold text-foreground tracking-tight">
                            Attendance
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{display}</p>
                    </div>
                </div>

                {hasData && (
                    <div className="text-right">
                        <p className={`cga-num text-2xl font-bold tabular-nums leading-none ${
                            avg >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                            avg >= 75 ? 'text-amber-600 dark:text-amber-400' :
                                        'text-rose-600 dark:text-rose-400'
                        }`}>
                            {avg}%
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">avg</p>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {hasData ? (
                    <OverallSummary stats={overallStats} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="rounded-full bg-muted p-4 border border-border">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No attendance records</p>
                        <p className="text-xs text-muted-foreground text-center max-w-[220px]">
                            Data will appear here once attendance is recorded for your class.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
