import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/context/AuthContext'
import { salariesAPI } from '@/services/api'
import {
    Banknote, BookOpen, CheckCircle2, Clock,
    ChevronDown, ChevronUp, Sun, Loader2,
} from 'lucide-react'

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;500;600;700;800&display=swap');
.sal-display { font-family: 'Cormorant Garamond', Georgia, serif; }
.sal-body    { font-family: 'Nunito', system-ui, sans-serif; }
.sal-num     { font-family: 'Cormorant Garamond', Georgia, serif; font-variant-numeric: tabular-nums; }
`

const MONTHS = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_CFG = {
    GENERATED: { label: 'Generated', cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400', icon: Clock },
    APPROVED:  { label: 'Approved',  cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-950/30 dark:text-blue-400',   icon: CheckCircle2 },
    PAID:      { label: 'Paid',      cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400', icon: Banknote },
}

const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString()}`

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = STATUS_CFG[status] || STATUS_CFG.GENERATED
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.cls}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
        </span>
    )
}

// ── Salary Card ───────────────────────────────────────────────────────────────
function SalaryCard({ salary }) {
    const [open, setOpen] = useState(false)
    const items = salary.lineItems || []

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow duration-200">
            {/* Card header */}
            <div className="p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30">
                            <Sun className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="sal-display text-lg font-bold text-foreground leading-tight">
                                {MONTHS[salary.month]} {salary.year}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 sal-body">
                                {items.length} subject{items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <StatusBadge status={salary.status} />
                        <p className="sal-num text-xl font-bold text-foreground">
                            {fmt(salary.totalSalary)}
                        </p>
                    </div>
                </div>

                {/* Summary row */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            Basic Salary
                        </p>
                        <p className="sal-num text-base font-bold text-foreground">{fmt(salary.basicSalary)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 border border-border/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            Additional Pay
                        </p>
                        <p className="sal-num text-base font-bold text-foreground">{fmt(salary.additionalPay)}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            Total
                        </p>
                        <p className="sal-num text-base font-bold text-primary">{fmt(salary.totalSalary)}</p>
                    </div>
                </div>

                {/* Breakdown toggle */}
                {items.length > 0 && (
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        {open ? 'Hide' : 'View'} subject breakdown
                        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                )}
            </div>

            {/* Breakdown table */}
            {open && items.length > 0 && (
                <div className="border-t border-border/60 bg-muted/20 px-4 md:px-5 py-3">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm sal-body">
                            <thead>
                                <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                    <th className="text-left py-2 pr-4">Subject</th>
                                    <th className="text-left py-2 pr-4">Class</th>
                                    <th className="text-right py-2 pr-4">Students</th>
                                    <th className="text-right py-2">Your Share</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-2.5 pr-4 font-medium text-foreground">
                                            {item.subjectName}
                                        </td>
                                        <td className="py-2.5 pr-4 text-muted-foreground">
                                            {item.className}
                                        </td>
                                        <td className="py-2.5 pr-4 text-right sal-num text-muted-foreground">
                                            {item.studentCount ?? '—'}
                                        </td>
                                        <td className="py-2.5 text-right sal-num font-semibold text-foreground">
                                            {fmt(item.teacherShare ?? item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="h-12 w-12 rounded-full bg-muted border border-border flex items-center justify-center">
                <Banknote className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
                No salary records yet
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
                Salary records will appear here once generated by the admin.
            </p>
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherSalaries() {
    const { user } = useAuth()
    const teacherId = user?.teacher?.id
    const [salaries, setSalaries] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!teacherId) return
        const fetch = async () => {
            setLoading(true)
            try {
                const res = await salariesAPI.getTeacherHistory(teacherId)
                setSalaries(res.data.salaries || [])
            } catch {
                // fail gracefully
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [teacherId])

    // Summary stats
    const totalPaid     = salaries.filter(s => s.status === 'PAID').reduce((sum, s) => sum + Number(s.totalSalary || 0), 0)
    const totalPending  = salaries.filter(s => s.status !== 'PAID').reduce((sum, s) => sum + Number(s.totalSalary || 0), 0)
    const paidCount     = salaries.filter(s => s.status === 'PAID').length

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: FONTS }} />
            <DashboardLayout title="My Salaries">
                <div className="sal-body space-y-5">

                    {/* Page header */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="h-[3px] w-full bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(var(--accent)/0.5)] to-transparent" />
                        <div className="p-5 md:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                                    <Banknote className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h1 className="sal-display text-2xl font-bold text-foreground tracking-tight">
                                        My Salaries
                                    </h1>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        View your generated salary records from admin
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading salary records…</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary stats */}
                            {salaries.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { label: 'Total Records', value: salaries.length },
                                        { label: 'Paid Records',  value: paidCount },
                                        { label: 'Amount Paid',   value: fmt(totalPaid) },
                                        { label: 'Pending',       value: fmt(totalPending) },
                                    ].map(stat => (
                                        <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                                                {stat.label}
                                            </p>
                                            <p className="sal-num text-xl font-bold text-foreground leading-none">
                                                {stat.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Records */}
                            <div className="space-y-3">
                                {salaries.length > 0
                                    ? salaries.map(s => (
                                        <SalaryCard key={s.id} salary={s} />
                                    ))
                                    : <EmptyState />
                                }
                            </div>
                        </>
                    )}
                </div>
            </DashboardLayout>
        </>
    )
}
