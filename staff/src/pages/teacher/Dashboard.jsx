import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { announcementsAPI, dashboardAPI } from '@/services/api'
import UserAvatar from '@/components/shared/UserAvatar'
import {
    BookOpen, Users, ClipboardList, CheckCircle2,
    XCircle, Clock, Megaphone, School, ChevronRight,
} from 'lucide-react'

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;500;600;700;800&display=swap');
.tch-display { font-family: 'Cormorant Garamond', Georgia, serif; }
.tch-body    { font-family: 'Nunito', system-ui, sans-serif; }
.tch-num     { font-family: 'Cormorant Garamond', Georgia, serif; font-variant-numeric: tabular-nums; }
`

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting(name) {
    const h = new Date().getHours()
    const salut = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
    return name ? `${salut}, ${name.split(' ')[0]}` : salut
}

function timeAgo(d) {
    const s = (Date.now() - new Date(d)) / 1000
    if (s < 60) return 'Just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
}

const SUBJECT_ACCENTS = [
    { bar: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-800', badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
    { bar: 'bg-violet-500', ring: 'ring-violet-200 dark:ring-violet-800', badge: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300' },
    { bar: 'bg-teal-500', ring: 'ring-teal-200 dark:ring-teal-800', badge: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300' },
    { bar: 'bg-rose-500', ring: 'ring-rose-200 dark:ring-rose-800', badge: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300' },
    { bar: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-800', badge: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' },
    { bar: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-800', badge: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' },
]

const PRIORITY_CFG = {
    URGENT:        { bar: 'bg-red-500',      badge: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30',       label: 'Urgent' },
    HIGH:          { bar: 'bg-red-400',      badge: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20',       label: 'High' },
    NORMAL:        { bar: 'bg-primary/60',   badge: 'text-primary bg-primary/8',                                          label: 'Notice' },
    INFORMATIONAL: { bar: 'bg-blue-400',     badge: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30',   label: 'Info' },
    LOW:           { bar: 'bg-muted-foreground/30', badge: 'text-muted-foreground bg-muted',                              label: 'Low' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroCard({ teacher }) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    })

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(var(--accent)/0.5)] to-transparent" />
            <div className="p-5 md:p-6">

                {/* Identity row */}
                <div className="flex items-start gap-4 mb-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <UserAvatar
                            name={teacher?.name}
                            profilePicUrl={teacher?.profilePicUrl}
                            size="lg"
                            shape="rounded"
                            className="shadow-md border-0"
                        />
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping [animation-duration:2.5s]" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />
                        </span>
                    </div>

                    {/* Name + greeting */}
                    <div className="flex-1 min-w-0 pt-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--accent))] mb-1">
                            {today}
                        </p>
                        <h1 className="tch-display text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight truncate">
                            {greeting(teacher?.name)}.
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    )
}


function StatRow({ stats }) {
    const items = [
        {
            label: 'Subjects',
            value: stats?.totalSubjects ?? 0,
            icon: BookOpen,
            cls: 'text-primary',
            bg: 'bg-primary/8 border-primary/20',
            iconBg: 'bg-primary/10 text-primary',
        },
        {
            label: 'Students',
            value: stats?.totalStudents ?? 0,
            icon: Users,
            cls: 'text-foreground',
            bg: 'bg-muted/40 border-border/60',
            iconBg: 'bg-muted text-muted-foreground',
        },
        {
            label: 'Present',
            value: stats?.todayAttendance?.present ?? 0,
            icon: CheckCircle2,
            cls: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Absent',
            value: stats?.todayAttendance?.absent ?? 0,
            icon: XCircle,
            cls: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-800/40',
            iconBg: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {items.map((item) => {
                const Icon = item.icon
                return (
                    <div key={item.label} className={`rounded-xl border ${item.bg} p-4 flex items-center gap-3`}>
                        <span className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg ${item.iconBg}`}>
                            <Icon className="h-4 w-4" strokeWidth={2} />
                        </span>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground leading-none mb-1.5">
                                {item.label}
                            </p>
                            <p className={`tch-num text-2xl font-bold leading-none ${item.cls}`}>{item.value}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function ClassCard({ cls, idx }) {
    const accent = SUBJECT_ACCENTS[idx % SUBJECT_ACCENTS.length]

    return (
        <div className={`group relative flex flex-col rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 overflow-hidden`}>
            {/* Top color bar */}
            <div className={`h-[3px] w-full ${accent.bar}`} />

            <div className="flex flex-col flex-1 p-4 md:p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="tch-display text-xl font-semibold text-foreground leading-tight truncate">
                            {cls.className}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                            <School className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{cls.subjectNames.join(', ')}</span>
                            {cls.gradeLevel && (
                                <>
                                    <span className="text-border">·</span>
                                    <span className="text-muted-foreground/70 truncate">{cls.gradeLevel}</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Student count badge */}
                    <span className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${accent.badge}`}>
                        <Users className="h-3 w-3" />
                        {cls.studentCount}
                    </span>
                </div>

                {/* CTA */}
                <Link
                    to={`/mark-attendance/${cls.classId}`}
                    className={`mt-auto flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-150
                        bg-foreground/5 hover:bg-primary hover:text-primary-foreground border border-border/60 hover:border-primary
                        text-foreground group-hover:border-primary/50`}
                >
                    <ClipboardList className="h-4 w-4" />
                    Mark Attendance
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150" />
                </Link>
            </div>
        </div>
    )
}

function AnnouncementCard({ ann, idx }) {
    const cfg = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.NORMAL
    const date = ann.publishedAt || ann.createdAt

    return (
        <div
            className="relative flex gap-3 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-150 overflow-hidden p-4"
            style={{ animationDelay: `${idx * 50}ms` }}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.bar} rounded-l-xl`} />
            <div className="pl-1 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="tch-display text-sm font-semibold text-foreground leading-snug">{ann.title}</h4>
                    <span className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                </div>
                {ann.content && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ann.content}</p>
                )}
                <p className="text-[11px] text-muted-foreground/60 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(date)}
                </p>
            </div>
        </div>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
    const [teacherStats, setTeacherStats] = useState(null)
    const [announcements, setAnnouncements] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            try {
                const [statsRes, annRes] = await Promise.all([
                    dashboardAPI.getTeacherStats(),
                    announcementsAPI.getAll(),
                ])
                setTeacherStats(statsRes.data)
                setAnnouncements(annRes.data.announcements || annRes.data || [])
            } catch {
                // fail gracefully
            } finally {
                setLoading(false)
            }
        }
        fetch()
    }, [])

    if (loading) {
        return (
            <DashboardLayout title="Dashboard">
                <style dangerouslySetInnerHTML={{ __html: FONTS }} />
                <div className="tch-body flex flex-col items-center justify-center min-h-[60vh] gap-5">
                    <div className="relative h-14 w-14">
                        <div className="absolute inset-0 rounded-full border-[3px] border-[hsl(var(--accent)/0.2)] border-t-[hsl(var(--accent))] animate-spin" />
                        <div className="absolute inset-[5px] rounded-full border-2 border-primary/10 border-b-primary/40 animate-spin [animation-direction:reverse] [animation-duration:800ms]" />
                    </div>
                    <div className="text-center">
                        <p className="tch-display text-lg font-medium text-foreground">Loading dashboard</p>
                        <p className="text-sm text-muted-foreground mt-1">Fetching your data…</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const { teacher, stats, classes = [] } = teacherStats ?? {}

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: FONTS }} />
            <DashboardLayout title="Dashboard">
                <div className="tch-body space-y-5">

                    {/* Hero */}
                    <HeroCard teacher={teacher} />

                    {/* Stats row */}
                    <StatRow stats={stats} />

                    {/* Classes section */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <BookOpen className="h-4 w-4 text-primary" strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="tch-display text-lg font-bold text-foreground tracking-tight">
                                        Your Classes
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Mark attendance for each assigned class
                                    </p>
                                </div>
                            </div>
                            {classes.length > 0 && (
                                <div className="h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary/10">
                                    <span className="tch-num text-xs font-bold text-primary">{classes.length}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-5">
                            {classes.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                    {classes.map((cls, idx) => (
                                        <ClassCard key={cls.key} cls={cls} idx={idx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center">
                                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No subjects assigned yet</p>
                                    <p className="text-xs text-muted-foreground text-center">
                                        Contact an admin to get subjects assigned to you.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Announcements */}
                    <div className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Megaphone className="h-4 w-4 text-primary" strokeWidth={2} />
                                </div>
                                <div>
                                    <h2 className="tch-display text-lg font-bold text-foreground tracking-tight">
                                        Announcements
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Latest updates & notices</p>
                                </div>
                            </div>
                            {announcements.length > 0 && (
                                <div className="h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary/10">
                                    <span className="tch-num text-xs font-bold text-primary">{announcements.length}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-5">
                            {announcements.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {announcements.slice(0, 6).map((ann, idx) => (
                                        <AnnouncementCard key={ann.id ?? idx} ann={ann} idx={idx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center">
                                        <Megaphone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </DashboardLayout>
        </>
    )
}
