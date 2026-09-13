import DashboardLayout from '@/components/layout/DashboardLayout'
import TimetableView from '@/components/shared/TimetableView'

export default function TeacherTimetable() {
  return (
    <DashboardLayout title="My Timetable">
      <TimetableView title="My Teaching Schedule" />
    </DashboardLayout>
  )
}
