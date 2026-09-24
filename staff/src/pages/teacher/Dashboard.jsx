/**
 * Teacher dashboard.
 *
 * Deliberately the same shell as the admin dashboard — same welcome banner,
 * same Card primitives, same tokens — so the product reads as one thing. Only
 * the content differs: today's periods and the attendance trend, side by side,
 * with notices underneath.
 */

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { announcementsAPI, dashboardAPI, timetableAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import AttendanceChart from '@/components/shared/AttendanceChart'
import TodaySchedule from '@/components/shared/TodaySchedule'
import { CalendarDays, ClipboardCheck, Megaphone } from 'lucide-react'

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

const PRIORITY = {
  URGENT:        { rule: 'bg-red-500',             label: 'Urgent' },
  HIGH:          { rule: 'bg-red-400',             label: 'High' },
  NORMAL:        { rule: 'bg-primary-500/60',      label: 'Notice' },
  INFORMATIONAL: { rule: 'bg-blue-400',            label: 'Info' },
  LOW:           { rule: 'bg-gray-300 dark:bg-dark-700', label: 'Low' },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function timeAgo(d) {
  const s = (Date.now() - new Date(d)) / 1000
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-gray-100 dark:bg-dark-800', className)} />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

// ── Card header ──────────────────────────────────────────────────────────────
// Same title / description / icon-chip arrangement the admin cards use.

function PanelHeader({ title, description, icon: Icon }) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/8 dark:bg-primary-500/15">
          <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
    </CardHeader>
  )
}

function Notice({ ann }) {
  const cfg = PRIORITY[ann.priority] || PRIORITY.NORMAL
  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-100 p-4 pl-5 dark:border-dark-800">
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', cfg.rule)} aria-hidden="true" />
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-gray-800 dark:text-dark-100">
          {ann.title}
        </h4>
        <span className="shrink-0 text-[11px] text-gray-400 dark:text-dark-500">{cfg.label}</span>
      </div>
      {ann.content && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-dark-400">
          {ann.content}
        </p>
      )}
      <p className="mt-2 text-[11px] text-gray-400 dark:text-dark-500">
        {timeAgo(ann.publishedAt || ann.createdAt)}
      </p>
    </div>
  )
}

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-800">
        <Icon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
      </div>
      <p className="text-sm text-gray-400 dark:text-dark-500">{message}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { user } = useAuth()

  const [announcements, setAnnouncements] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const [week, setWeek] = useState(null)
  const [weekLoading, setWeekLoading] = useState(true)
  const [weekClassId, setWeekClassId] = useState(null)

  const teacherName = user?.teacher?.name?.split(' ')[0] || 'Teacher'

  useEffect(() => {
    const load = async () => {
      try {
        const [annRes, ttRes] = await Promise.all([
          announcementsAPI.getAll(),
          timetableAPI.getMyTimetable(),
        ])
        setAnnouncements(annRes.data.announcements || annRes.data || [])
        setEntries(ttRes.data.entries || [])
      } catch (error) {
        console.error('Failed to fetch dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Separate so changing the charted class re-queries only the chart.
  useEffect(() => {
    let cancelled = false
    const fetchWeek = async () => {
      setWeekLoading(true)
      try {
        const res = await dashboardAPI.getWeeklyAttendance(weekClassId ? { classId: weekClassId } : {})
        if (cancelled) return
        setWeek(res.data)
        if (weekClassId === null && res.data.classId) setWeekClassId(res.data.classId)
      } catch (error) {
        if (!cancelled) console.error('Failed to fetch weekly attendance:', error)
      } finally {
        if (!cancelled) setWeekLoading(false)
      }
    }
    fetchWeek()
    return () => { cancelled = true }
  }, [weekClassId])

  // The timetable comes back for the whole week; today is what this page wants.
  const todaysPeriods = useMemo(() => {
    const name = DAY_NAMES[new Date().getDay()]
    return entries.filter(e => e.dayOfWeek === name)
  }, [entries])

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  const periodCount = todaysPeriods.length

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">

        {/* Welcome */}
        <div className={cn(
          'rounded-2xl border px-6 py-5',
          'bg-gradient-to-r from-primary-500/8 via-primary-500/4 to-transparent',
          'dark:from-primary-500/12 dark:via-primary-500/6 dark:to-transparent',
          'border-primary-500/12 dark:border-primary-500/20'
        )}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-dark-50">
                Welcome back, {teacherName}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 dark:text-dark-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{today()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panels */}
        <div className="grid gap-6 md:grid-cols-2">

          <Card>
            <PanelHeader
              title="Today's Classes"
              description={
                periodCount === 0
                  ? 'Nothing scheduled'
                  : `${periodCount} ${periodCount === 1 ? 'period' : 'periods'} today`
              }
              icon={CalendarDays}
            />
            <CardContent>
              <TodaySchedule entries={todaysPeriods} loading={false} />
            </CardContent>
          </Card>

          <Card>
            <PanelHeader
              title="Attendance"
              description="Last 7 days, by day"
              icon={ClipboardCheck}
            />
            <CardContent>
              <AttendanceChart
                days={week?.days ?? []}
                classes={week?.classes ?? []}
                classId={weekClassId ?? week?.classId}
                scopeLabel={week?.className}
                scopeClassCount={week?.scopeClassCount}
                daysFromTimetable={week?.daysFromTimetable ?? true}
                onClassChange={setWeekClassId}
                loading={weekLoading}
              />
            </CardContent>
          </Card>

        </div>

        {/* Notices */}
        <Card>
          <PanelHeader
            title="Notices"
            description="Latest updates from the office"
            icon={Megaphone}
          />
          <CardContent>
            {announcements.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {announcements.slice(0, 6).map((ann, i) => (
                  <Notice key={ann.id ?? i} ann={ann} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Megaphone} message="No notices yet" />
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
