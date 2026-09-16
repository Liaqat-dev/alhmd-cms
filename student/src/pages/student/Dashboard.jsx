import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { announcementsAPI, dashboardAPI, feesAPI } from '@/services/api'
import ProfileHeader from '@/components/dashboard/student/ProfileHeader'
import TodaysLectures from '@/components/dashboard/student/TodaysLectures'
import AttendanceStats from '@/components/dashboard/student/AttendanceStats'
import ClassStats from '@/components/dashboard/student/ClassStats'
import AnnouncementsSection from '@/components/dashboard/student/AnnouncementsSection'

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;0,9..144,800;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600;700&display=swap');
.cga-display { font-family: 'Fraunces', Georgia, serif; }
.cga-body { font-family: 'Outfit', system-ui, sans-serif; }
.cga-num { font-family: 'Fraunces', Georgia, serif; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
`

export default function StudentDashboard() {
    const [data, setData] = useState(null)
    const [announcements, setAnnouncements] = useState([])
    const [challans, setChallans] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [dashRes, annRes, challanRes] = await Promise.all([
                    dashboardAPI.getStudentDashboard(),
                    announcementsAPI.getAll(),
                    feesAPI.getMyChallans().catch(() => ({ data: [] })),
                ])
                setData(dashRes.data)
                setAnnouncements(annRes.data.announcements || annRes.data || [])
                const rawChallans = challanRes.data?.challans ?? challanRes.data ?? []
                setChallans(Array.isArray(rawChallans) ? rawChallans : [])
            } catch {
                // fail gracefully
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const outstandingBalance = useMemo(() => {
        return challans
            .filter(c => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(c.status))
            .reduce((sum, c) => sum + (Number(c.totalAmount) - Number(c.paidAmount)), 0)
    }, [challans])

    const unpaidCount = useMemo(
        () => challans.filter(c => ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(c.status)).length,
        [challans],
    )

    const now = new Date()

    if (loading) {
        return (
            <DashboardLayout title="Dashboard">
                <style dangerouslySetInnerHTML={{ __html: FONTS }} />
                <div className="cga-body flex flex-col items-center justify-center min-h-[60vh] gap-5">
                    <div className="relative h-14 w-14">
                        <div className="absolute inset-0 rounded-full border-[3px] border-primary/15 border-t-primary animate-spin" />
                        <div className="absolute inset-[5px] rounded-full border-[2px] border-primary/10 border-b-primary/40 animate-spin [animation-direction:reverse] [animation-duration:800ms]" />
                    </div>
                    <div className="text-center">
                        <p className="cga-display text-lg font-medium text-foreground">Loading your dashboard</p>
                        <p className="text-sm text-muted-foreground mt-1">Fetching latest information…</p>
                    </div>
                </div>
            </DashboardLayout>
        )
    }

    const student = data?.student
    const stats = data?.attendanceStats
    const timetable = data?.timetable || []
    const classes = data?.enrolledClasses || []
    const totalSubjects = student?.enrolledSubjectCount ?? 0

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: FONTS }} />
            <DashboardLayout title="Dashboard">
                <div className="cga-body space-y-5">
                    <ProfileHeader
                        student={student}
                        stats={stats}
                        outstandingBalance={outstandingBalance}
                        unpaidCount={unpaidCount}
                        totalSubjects={totalSubjects}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Left column — schedule + classes */}
                        <div className="lg:col-span-2 flex flex-col gap-5">
                            <TodaysLectures lectures={timetable} />
                            <ClassStats classes={classes} />
                        </div>

                        {/* Right column — attendance breakdown */}
                        <div className="lg:col-span-3">
                            <AttendanceStats
                                month={now.toLocaleDateString('en-US', { month: 'long' })}
                                year={now.getFullYear()}
                                overallStats={stats}
                            />
                        </div>
                    </div>

                    <AnnouncementsSection announcements={announcements} limit={5} />
                </div>
            </DashboardLayout>
        </>
    )
}
