import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { dashboardAPI } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import UserAvatar from '@/components/shared/UserAvatar'
import {
  Users,
  GraduationCap,
  Award,
  School,
  CheckCircle2,
  XCircle,
  Palmtree,
  TrendingUp,
  CalendarDays,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function today() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-100 dark:bg-dark-800',
        className
      )}
    />
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconBg, iconColor, className, children }) {
  return (
    <div className={cn(
      'rounded-xl border border-gray-100 dark:border-dark-800',
      'bg-white dark:bg-dark-900',
      'p-2 xs:p-3 shadow-sm shadow-gray-100/50 dark:shadow-none',
      'hover:shadow-md dark:hover:shadow-none hover:border-gray-200 dark:hover:border-dark-700',
      'transition-all duration-200',
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-500">
            {label}
          </p>
          {value !== undefined ? (
            <p className="text-3xl font-bold text-gray-800 dark:text-dark-50 mt-2 tabular-nums">
              {value}
            </p>
          ) : (
            children
          )}
        </div>
        <div className={cn(
          'h-11 w-11 shrink-0 rounded-xl flex items-center justify-center',
          iconBg
        )}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-dark-800 flex items-center justify-center">
        <Icon className="h-5 w-5 text-gray-400 dark:text-dark-500" />
      </div>
      <p className="text-sm text-gray-400 dark:text-dark-500">{message}</p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const adminName = user?.admin?.name?.split(' ')[0] || 'Admin'

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardAPI.getAdminStats()
        setStats(response.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <DashboardSkeleton />
      </DashboardLayout>
    )
  }

  const maxStudents = Math.max(
    1,
    ...(stats?.classStats?.map(c => c.studentCount) ?? [0])
  )

  const attendance = stats?.stats?.todayAttendance ?? { present: 0, absent: 0, leave: 0 }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className={cn(
          'rounded-2xl border px-6 py-5',
          'bg-gradient-to-r from-primary-500/8 via-primary-500/4 to-transparent',
          'dark:from-primary-500/12 dark:via-primary-500/6 dark:to-transparent',
          'border-primary-500/12 dark:border-primary-500/20'
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-dark-50">
                Welcome back, {adminName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500 dark:text-dark-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{today()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <StatCard
            label="Total Students"
            value={stats?.stats?.totalStudents ?? 0}
            icon={GraduationCap}
            iconBg="bg-blue-500/10 dark:bg-blue-500/15"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Total Teachers"
            value={stats?.stats?.totalTeachers ?? 0}
            icon={Users}
            iconBg="bg-violet-500/10 dark:bg-violet-500/15"
            iconColor="text-violet-600 dark:text-violet-400"
          />
          <StatCard
            label="Total Classes"
            value={stats?.stats?.totalClasses ?? 0}
            icon={School}
            iconBg="bg-amber-500/10 dark:bg-amber-500/15"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Passed Out"
            value={stats?.stats?.passedOutStudents ?? 0}
            icon={Award}
            iconBg="bg-sky-500/10 dark:bg-sky-500/15"
            iconColor="text-sky-600 dark:text-sky-400"
          />

          {/* Attendance card — custom layout, and wide enough for three figures */}
          <StatCard
            className="sm:col-span-2 lg:col-span-4 xl:col-span-2"
            label="Today's Attendance"
            icon={TrendingUp}
            iconBg="bg-emerald-500/10 dark:bg-emerald-500/15"
            iconColor="text-emerald-600 dark:text-emerald-400"
          >
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {attendance.present}
                </span>
                <span className="text-xs text-gray-400 dark:text-dark-500">Present</span>
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xl font-bold text-red-500 dark:text-red-400 tabular-nums">
                  {attendance.absent}
                </span>
                <span className="text-xs text-gray-400 dark:text-dark-500">Absent</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Palmtree className="h-4 w-4 text-amber-500" />
                <span className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {attendance.leave}
                </span>
                <span className="text-xs text-gray-400 dark:text-dark-500">Leave</span>
              </span>
            </div>
          </StatCard>
        </div>

        {/* Detail Panels */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* Class Statistics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Class Statistics</CardTitle>
                  <CardDescription>Student distribution across classes</CardDescription>
                </div>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary-500/8 dark:bg-primary-500/15">
                  <School className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.classStats?.length ? (
                <div className="space-y-4">
                  {stats.classStats.map((cls) => {
                    const pct = Math.round((cls.studentCount / maxStudents) * 100)
                    return (
                      <div key={cls.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-gray-700 dark:text-dark-200 truncate">
                              {cls.name}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-dark-500 shrink-0">
                              {cls.gradeLevel}
                            </span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-gray-700 dark:text-dark-200 ml-3 shrink-0">
                            {cls.studentCount}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-dark-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState icon={School} message="No classes yet" />
              )}
            </CardContent>
          </Card>

          {/* Recent Students */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Students</CardTitle>
                  <CardDescription>Latest enrollments</CardDescription>
                </div>
                <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-primary-500/8 dark:bg-primary-500/15">
                  <GraduationCap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentStudents?.length ? (
                <div className="space-y-1">
                  {stats.recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-100',
                        'hover:bg-primary-500/[0.04] dark:hover:bg-primary-500/[0.07]'
                      )}
                    >
                      <UserAvatar name={student.name} profilePicUrl={student.profilePicUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 dark:text-dark-100 truncate leading-tight">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-dark-500 mt-0.5">
                          {student.rollNumber}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-dark-400 bg-gray-100 dark:bg-dark-800 px-2.5 py-1 rounded-lg shrink-0">
                        {student.class?.name ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={GraduationCap} message="No students yet" />
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  )
}
