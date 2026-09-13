import { useState, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { attendanceAPI } from '@/services/api'
import { useClasses } from '@/hooks/useClasses'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    AlertTriangle, CalendarDays, ClipboardCheck,
    Download, Search, Star, TrendingUp, Users,
} from 'lucide-react'

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const YEARS = [2024, 2025, 2026, 2027]

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const STATUS_CFG = {
    PRESENT: { label: 'P', cell: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
    ABSENT: { label: 'A', cell: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
    LATE: { label: 'L', cell: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
}

function pctColor(pct) {
    if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 75) return 'text-blue-600 dark:text-blue-400'
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
}

function pctBarColor(pct) {
    if (pct >= 90) return 'bg-emerald-500'
    if (pct >= 75) return 'bg-blue-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
}

function parseDate(dateStr) {
    // dateStr is now a clean YYYY-MM-DD local date key from the backend
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return { day: date.getDate(), abbr: DAY_ABBR[date.getDay()] }
}

function StatCard({ label, value, icon: Icon, gradient, iconColor }) {
    return (
        <div className="card p-3 sm:p-4">
            <div className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br flex-shrink-0', gradient)}>
                    <Icon className={cn('h-4 w-4', iconColor)} />
                </div>
                <div>
                    <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
                    <p className="text-xl font-bold tracking-tight leading-none">{value}</p>
                </div>
            </div>
        </div>
    )
}

export default function AttendanceRegister() {
    const [selectedClassId, setSelectedClassId] = useState('')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [gridData, setGridData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    const { classes } = useClasses()
    const { toast } = useToast()

    // Reset grid when class changes
    useEffect(() => {
        setGridData(null)
    }, [selectedClassId])

    useEffect(() => {
        if (!selectedClassId) return
        fetchGrid()
    }, [selectedClassId, month, year])

    async function fetchGrid() {
        try {
            setLoading(true)
            const res = await attendanceAPI.getClassGrid(selectedClassId, { month, year })
            setGridData(res.data)
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load attendance data' })
        } finally {
            setLoading(false)
        }
    }

    const filteredStudents = useMemo(() => {
        if (!gridData?.students) return []
        if (!search.trim()) return gridData.students
        const q = search.toLowerCase()
        return gridData.students.filter(s =>
            s.name.toLowerCase().includes(q) || (s.rollNumber || '').toLowerCase().includes(q)
        )
    }, [gridData, search])

    const stats = useMemo(() => {
        if (!filteredStudents.length) return null
        const withData = filteredStudents.filter(s => s.stats.total > 0)
        const avgPct = withData.length
            ? Math.round(withData.reduce((sum, s) => sum + s.stats.percentage, 0) / withData.length)
            : 0
        return {
            total: filteredStudents.length,
            avgPct,
            perfect: withData.filter(s => s.stats.percentage === 100).length,
            atRisk: withData.filter(s => s.stats.percentage < 75).length,
        }
    }, [filteredStudents])

    const selectedClass = classes.find(c => c.id === selectedClassId)
    const monthLabel = MONTHS.find(m => m.value === month)?.label

    const hasGrid = gridData && gridData.dates.length > 0

    function downloadExcel() {
        if (!hasGrid) return

        const dateHeaders = gridData.dates.map(d => {
            const { day, abbr } = parseDate(d)
            return `${abbr} ${day}`
        })

        const header = ['#', 'Student ID', 'Student', 'Roll No', ...dateHeaders, 'Present', 'Absent', 'Late', 'Attendance %']

        const rows = gridData.students.map((s, i) => [
            i + 1,
            s.studentId,
            s.name,
            s.rollNumber || '',
            ...gridData.dates.map(d => s.records[d] ? STATUS_CFG[s.records[d]].label : ''),
            s.stats.present,
            s.stats.absent,
            s.stats.late,
            s.stats.total > 0 ? `${s.stats.percentage}%` : '',
        ])

        const ws = XLSX.utils.aoa_to_sheet([header, ...rows])

        ws['!cols'] = [
            { wch: 4 },
            { wch: 38 },
            { wch: 24 },
            { wch: 12 },
            ...gridData.dates.map(() => ({ wch: 5 })),
            { wch: 8 }, { wch: 7 }, { wch: 6 }, { wch: 13 },
        ]

        const wb = XLSX.utils.book_new()
        const sheetName = `${selectedClass?.name ?? 'Class'} - ${monthLabel} ${year}`
        XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))

        const fileName = [
            selectedClass?.name,
            monthLabel,
            year,
        ].filter(Boolean).join('_').replace(/\s+/g, '_') + '.xlsx'

        XLSX.writeFile(wb, fileName)
    }

    return (
        <DashboardLayout title="Attendance Register">
            <div className="space-y-4">

                {/* ── Filters ─────────────────────────────────────────── */}
                <div className="card p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Class */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Class</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select class…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Month */}
                        <div className="w-36">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Month</label>
                            <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Year */}
                        <div className="w-24">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Year</label>
                            <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Stats ────────────────────────────────────────────── */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Total Students" value={stats.total}
                            icon={Users} gradient="from-sky-500/10 to-sky-600/5" iconColor="text-sky-600" />
                        <StatCard label="Avg Attendance" value={stats.avgPct > 0 ? `${stats.avgPct}%` : '—'}
                            icon={TrendingUp} gradient="from-emerald-500/10 to-emerald-600/5" iconColor="text-emerald-600" />
                        <StatCard label="Perfect Attendance" value={stats.perfect}
                            icon={Star} gradient="from-violet-500/10 to-violet-600/5" iconColor="text-violet-600" />
                        <StatCard label="At Risk (<75%)" value={stats.atRisk}
                            icon={AlertTriangle} gradient="from-rose-500/10 to-rose-600/5" iconColor="text-rose-600" />
                    </div>
                )}

                {/* ── Main Panel ───────────────────────────────────────── */}
                {selectedClassId ? (
                    <div className="card overflow-hidden">
                        {/* Panel header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500/10 flex-shrink-0">
                                    <ClipboardCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold leading-tight">
                                        {selectedClass?.name}
                                        <span className="font-normal text-muted-foreground"> — {monthLabel} {year}</span>
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    <Input
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search student…"
                                        className="pl-8 h-8 text-xs w-36 sm:w-48"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 gap-1.5 text-xs"
                                    disabled={!hasGrid}
                                    onClick={downloadExcel}
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Export</span>
                                </Button>
                            </div>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                            </div>
                        )}

                        {/* Grid */}
                        {!loading && hasGrid && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border/60">
                                            <th className="sticky left-0 z-10 bg-muted/40 text-left px-3 py-2.5 border-r border-border/40 min-w-[110px] sm:min-w-[100px]">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Student</span>
                                            </th>
                                            {gridData.dates.map(date => {
                                                const { day, abbr } = parseDate(date)
                                                return (
                                                    <th key={date} className="px-0 py-2 text-center min-w-[34px]">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[8px] font-medium text-muted-foreground/60 uppercase">{abbr}</span>
                                                            <span className="text-[11px] font-bold text-foreground tabular-nums">{day}</span>
                                                        </div>
                                                    </th>
                                                )
                                            })}
                                            <th className="px-2 py-2.5 text-center min-w-[32px] border-l border-border/40">
                                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">P</span>
                                            </th>
                                            <th className="px-2 py-2.5 text-center min-w-[32px]">
                                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">A</span>
                                            </th>
                                            <th className="px-2 py-2.5 text-center min-w-[32px]">
                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">L</span>
                                            </th>
                                            <th className="px-3 py-2.5 text-center min-w-[64px]">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rate</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student, i) => {
                                            const isAtRisk = student.stats.total > 0 && student.stats.percentage < 75
                                            const isEven = i % 2 === 0
                                            return (
                                                <tr
                                                    key={student.studentId}
                                                    className={cn(
                                                        'border-b border-border/30 transition-colors',
                                                        isAtRisk
                                                            ? 'bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-50/70 dark:hover:bg-rose-500/10'
                                                            : isEven
                                                                ? 'hover:bg-muted/30'
                                                                : 'bg-muted/[0.025] hover:bg-muted/30'
                                                    )}
                                                >
                                                    <td className={cn(
                                                        'sticky left-0 z-10 px-3 py-2 border-r border-border/40',
                                                        isAtRisk
                                                            ? 'bg-rose-50/40 dark:bg-rose-900/20'
                                                            : isEven ? 'bg-background' : 'bg-muted/[0.025]'
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            {isAtRisk && (
                                                                <span className="w-[3px] h-[22px] rounded-full bg-rose-400 flex-shrink-0" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className={cn(
                                                                    'text-[13px] font-medium leading-tight truncate',
                                                                    isAtRisk && 'text-rose-700 dark:text-rose-400'
                                                                )}>
                                                                    {student.name}
                                                                </p>
                                                                {student.rollNumber && (
                                                                    <p className="text-[10px] text-muted-foreground tabular-nums">{student.rollNumber}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {gridData.dates.map(date => {
                                                        const status = student.records[date]
                                                        const cfg = status ? STATUS_CFG[status] : null
                                                        return (
                                                            <td key={date} className="px-[3px] py-[5px] text-center">
                                                                {cfg ? (
                                                                    <span className={cn(
                                                                        'inline-flex items-center justify-center w-[26px] h-[26px] rounded-md text-[11px] font-bold select-none',
                                                                        cfg.cell
                                                                    )}>
                                                                        {cfg.label}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center justify-center w-[26px] h-[26px] text-muted-foreground/25 text-base select-none">·</span>
                                                                )}
                                                            </td>
                                                        )
                                                    })}

                                                    <td className="px-2 py-2 text-center border-l border-border/40">
                                                        <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{student.stats.present}</span>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">{student.stats.absent}</span>
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">{student.stats.late}</span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {student.stats.total > 0 ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={cn('text-xs font-bold tabular-nums', pctColor(student.stats.percentage))}>
                                                                    {student.stats.percentage}%
                                                                </span>
                                                                <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                                                                    <div
                                                                        className={cn('h-full rounded-full transition-all', pctBarColor(student.stats.percentage))}
                                                                        style={{ width: `${student.stats.percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/40 block text-center">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}

                                        {filteredStudents.length === 0 && (
                                            <tr>
                                                <td colSpan={gridData.dates.length + 5} className="py-10 text-center text-sm text-muted-foreground">
                                                    No students match your search
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Empty: no records for selected class/period */}
                        {!loading && gridData && !hasGrid && (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="rounded-full bg-muted p-4">
                                    <CalendarDays className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-muted-foreground">No attendance recorded for {monthLabel} {year}</p>
                                <p className="text-xs text-muted-foreground/60">No records found for this class and period</p>
                            </div>
                        )}

                        {/* Legend + summary footer */}
                        {hasGrid && (
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 border-t border-border/40 bg-muted/20">
                                {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                        <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold', cfg.cell)}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground capitalize">{key.toLowerCase()}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground/30 text-base">·</span>
                                    <span className="text-[11px] text-muted-foreground">No record</span>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5">
                                    <span className="w-[3px] h-4 rounded-full bg-rose-400" />
                                    <span className="text-[11px] text-muted-foreground">At risk (&lt;75%)</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="card flex flex-col items-center justify-center py-20 gap-3">
                        <div className="rounded-full bg-muted/60 p-5">
                            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">Select a class to view attendance</p>
                        <p className="text-xs text-muted-foreground text-center max-w-xs">
                            Choose a class from the filters above to load the full monthly attendance register
                        </p>
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}
