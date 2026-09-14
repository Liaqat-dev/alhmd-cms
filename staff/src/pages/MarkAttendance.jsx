import DashboardLayout from '@/components/layout/DashboardLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { GraduationCap, Users } from 'lucide-react'
import StudentAttendancePanel from '@/pages/attendance/StudentAttendancePanel'
import TeacherAttendancePanel from '@/pages/attendance/TeacherAttendancePanel'

// One shared "Mark Attendance" screen for marking either students or
// teachers present/absent/leave. Whoever holds BOTH attendance.create and
// teacherAttendance.create gets tabs to switch between them; holding just
// one skips the tabs and shows that screen directly. The route itself
// requires at least one of the two permissions — see App.jsx — so this
// component is never reached by someone with neither.
export default function MarkAttendance() {
  const { hasPermission } = useAuth()
  const canStudents = hasPermission('attendance.create')
  const canTeachers = hasPermission('teacherAttendance.create')

  if (canStudents && canTeachers) {
    return (
      <DashboardLayout title="Mark Attendance">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Students
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Teachers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="students">
            <StudentAttendancePanel />
          </TabsContent>
          <TabsContent value="teachers">
            <TeacherAttendancePanel />
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Mark Attendance">
      {canTeachers ? <TeacherAttendancePanel /> : <StudentAttendancePanel />}
    </DashboardLayout>
  )
}
