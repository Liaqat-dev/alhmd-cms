import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { attendanceAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { AlertTriangle, GraduationCap, Search, Star, TrendingUp, Users } from 'lucide-react'

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
]
const YEARS = [2024, 2025, 2026, 2027]

function pctColor(p) {
    if (p >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (p >= 75) return 'text-blue-600 dark:text-blue-400'
    if (p >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
}

function pctBarColor(p) {
    if (p >= 90) return 'bg-emerald-500'
    if (p >= 75) return 'bg-blue-500'
    if (p >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
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

function TeacherRow({ teacher }) {
    const isAtRisk = teacher.total > 0 && teacher.percentage < 75
    const initial   = teacher.name.charAt(0).toUpperCase()

    return (
        <div className={cn(
            'card overflow-hidden transition-all flex items-center gap-3 px-4 py-3',
            isAtRisk && 'ring-1 ring-rose-300 dark:ring-rose-500/40 bg-rose-50/60 dark:bg-rose-500/5'
        )}>
            <div className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
                isAtRisk
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                    : 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
            )}>
                {initial}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className={cn(
                        'text-sm font-semibold leading-tight',
                        isAtRisk && 'text-rose-700 dark:text-rose-400'
                    )}>
                        {teacher.name}
                    </p>
                    {isAtRisk && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            At Risk
                        </span>
                    )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                    {teacher.present}P / {teacher.absent}A / {teacher.leave}L &middot; {teacher.total} days
                </p>
            </div>

            {teacher.total > 0 ? (
                <div className="flex flex-col items-end gap-1 w-16 flex-shrink-0">
                    <span className={cn('text-base font-bold tabular-nums leading-tight', pctColor(teacher.percentage))}>
                        {teacher.percentage}%
                    </span>
                    <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div
                            className={cn('h-full rounded-full', pctBarColor(teacher.percentage))}
                            style={{ width: `${teacher.percentage}%` }}
                        />
                    </div>
                </div>
            ) : (
                <span className="text-xs text-muted-foreground/40 tabular-nums flex-shrink-0">No days yet</span>
            )}
        </div>
    )
}

export default function TeacherAttendancePage() {
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear]   = useState(new Date().getFullYear())
    const [data, setData]   = useState([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch]   = useState('')

    const { toast }     = useToast()

    const monthLabel = MONTHS.find(m => m.value === month)?.label

    useEffect(() => {
        fetchData()
    }, [month, year])

    async function fetchData() {
        try {
            setLoading(true)
            const res = await attendanceAPI.getTeacherReport({ month, year })
            setData(res.data.report)
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load teacher attendance' })
        } finally {
            setLoading(false)
        }
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return data
        const q = search.toLowerCase()
        return data.filter(t => t.name.toLowerCase().includes(q))
    }, [data, search])

    const stats = useMemo(() => {
        if (!filtered.length) return null
        const withDays = filtered.filter(t => t.total > 0)
        const avgPct = withDays.length
            ? Math.round(withDays.reduce((sum, t) => sum + t.percentage, 0) / withDays.length)
            : 0
        const perfect = withDays.filter(t => t.percentage === 100).length
        const atRisk = withDays.filter(t => t.percentage < 75).length
        return { total: filtered.length, avgPct, perfect, atRisk }
    }, [filtered])

    return (
        <DashboardLayout title="Teacher Attendance">
            <div className="space-y-4">

                {/* Filters */}
                <div className="card p-4">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="w-36">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Month</label>
                            <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-24">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Year</label>
                            <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 min-w-[180px] max-w-xs">
                            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Search</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search teacher…"
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard label="Total Teachers" value={stats.total}
                            icon={Users} gradient="from-sky-500/10 to-sky-600/5" iconColor="text-sky-600" />
                        <StatCard label="Avg Attendance" value={stats.avgPct > 0 ? `${stats.avgPct}%` : '—'}
                            icon={TrendingUp} gradient="from-emerald-500/10 to-emerald-600/5" iconColor="text-emerald-600" />
                        <StatCard label="Perfect Attendance" value={stats.perfect}
                            icon={Star} gradient="from-violet-500/10 to-violet-600/5" iconColor="text-violet-600" />
                        <StatCard label="At Risk (<75%)" value={stats.atRisk}
                            icon={AlertTriangle} gradient="from-rose-500/10 to-rose-600/5" iconColor="text-rose-600" />
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-1 lg:grid-cols-2">
                        {filtered.map(teacher => (
                            <TeacherRow key={teacher.teacherId} teacher={teacher} />
                        ))}
                    </div>
                ) : (
                    <div className="card flex flex-col items-center justify-center py-20 gap-3">
                        <div className="rounded-full bg-muted/60 p-5">
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold">
                            {search ? 'No teachers match your search' : `No teacher data for ${monthLabel} ${year}`}
                        </p>
                        {!search && (
                            <p className="text-xs text-muted-foreground text-center max-w-xs">
                                Attendance is marked by an admin or authorized teacher for each day.
                            </p>
                        )}
                    </div>
                )}

            </div>
        </DashboardLayout>
    )
}
