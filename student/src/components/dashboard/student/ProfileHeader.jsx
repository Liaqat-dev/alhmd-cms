import { AlertCircle, CheckCircle2, BookOpen, TrendingUp } from 'lucide-react'
import UserAvatar from '@/components/shared/UserAvatar'

/* ── helpers ─────────────────────────────────────────────────── */
function fmtRs(n) {
    if (n === 0) return 'Nil'
    return 'Rs\u00a0' + new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(n)
}

function attendanceTheme(pct) {
    if (pct >= 85) return { txt: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/70 dark:border-emerald-800/40', icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' }
    if (pct >= 75) return { txt: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/70 dark:border-amber-800/40', icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' }
    return { txt: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200/70 dark:border-rose-800/40', icon: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' }
}

/* ── Arc gauge SVG ───────────────────────────────────────────── */
function ArcGauge({ pct }) {
    const r = 30, cx = 38, cy = 38
    const circ = 2 * Math.PI * r
    const theme = attendanceTheme(pct)
    const color = pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'

    return (
        <svg width="76" height="76" viewBox="0 0 76 76" className="flex-shrink-0">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground/8" />
            <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct / 100)}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }}
            />
            <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: '13px', fontWeight: 700, fill: color, fontFamily: 'Fraunces, Georgia, serif' }}>
                {pct}%
            </text>
        </svg>
    )
}

/* ── Stat pillar ─────────────────────────────────────────────── */
function StatPillar({ label, Icon, iconCls, value, valueCls, sub, bg, border, arc }) {
    return (
        <div className={`relative flex-1 min-w-0 rounded-xl border ${border} ${bg} p-4 md:p-5 flex flex-col gap-3 overflow-hidden`}>
            {/* label row */}
            <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0 ${iconCls}`}>
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground leading-none">
                    {label}
                </p>
            </div>

            {/* value row */}
            <div className="flex items-end justify-between gap-2">
                <div>
                    <p className={`cga-num text-[2rem] md:text-[2.25rem] font-bold leading-none tracking-tight ${valueCls}`}>
                        {value}
                    </p>
                    {sub && (
                        <p className="mt-2 text-xs text-muted-foreground leading-snug">{sub}</p>
                    )}
                </div>
                {arc}
            </div>
        </div>
    )
}

/* ── Main component ──────────────────────────────────────────── */
export default function ProfileHeader({ student, stats, outstandingBalance, unpaidCount, totalSubjects }) {
    if (!student) return null

    const pct = stats?.percentage ?? 0
    const attTheme = attendanceTheme(pct)
    const isOwed = outstandingBalance > 0

    const initials = (student?.name || '?')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const owedTheme = isOwed
        ? { txt: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/70 dark:border-amber-800/40', icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' }
        : { txt: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/70 dark:border-emerald-800/40', icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' }

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            {/* accent stripe */}
            <div className="h-[3px] w-full bg-gradient-to-r from-primary via-primary/50 to-transparent" />

            <div className="p-5 md:p-6">
                {/* Identity row */}
                <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <UserAvatar
                            name={student?.name}
                            profilePicUrl={student?.profilePicUrl}
                            size="lg"
                            shape="rounded"
                            className="shadow-md border-0"
                        />
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping [animation-duration:2.5s]" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                        </span>
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0 pt-1">
                        <h1 className="cga-display text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight truncate">
                            {student?.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/50" />
                                Roll&nbsp;
                                <span className="font-semibold text-foreground/80 tabular-nums">
                                    {student?.rollNumber}
                                </span>
                            </span>
                            <span className="text-border/60">·</span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {student?.className || student?.class || '—'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Three hero stats ─────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Outstanding */}
                    <StatPillar
                        label="Outstanding"
                        Icon={isOwed ? AlertCircle : CheckCircle2}
                        iconCls={owedTheme.icon}
                        value={fmtRs(outstandingBalance)}
                        valueCls={owedTheme.txt}
                        sub={isOwed
                            ? `${unpaidCount} challan${unpaidCount !== 1 ? 's' : ''} pending`
                            : 'All fees cleared'}
                        bg={owedTheme.bg}
                        border={owedTheme.border}
                    />

                    {/* Enrolled subjects */}
                    <StatPillar
                        label="Subjects Enrolled"
                        Icon={BookOpen}
                        iconCls="bg-primary/10 text-primary"
                        value={totalSubjects || '—'}
                        valueCls="text-primary"
                        sub={
                            totalSubjects > 0
                                ? `across ${student?.enrolledClasses?.length || 1} class${(student?.enrolledClasses?.length || 1) !== 1 ? 'es' : ''}`
                                : 'Not enrolled yet'
                        }
                        bg="bg-primary/5"
                        border="border-primary/20"
                    />

                    {/* Attendance */}
                    <StatPillar
                        label="Attendance"
                        Icon={TrendingUp}
                        iconCls={attTheme.icon}
                        value={`${pct}%`}
                        valueCls={attTheme.txt}
                        sub={
                            stats
                                ? `${stats.present} present · ${stats.absent} absent · ${stats.leave} leave`
                                : 'No data yet'
                        }
                        bg={attTheme.bg}
                        border={attTheme.border}
                        arc={<ArcGauge pct={pct} />}
                    />
                </div>
            </div>
        </div>
    )
}
