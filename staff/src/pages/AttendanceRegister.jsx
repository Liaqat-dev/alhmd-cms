import DashboardLayout from '@/components/layout/DashboardLayout'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { GraduationCap, Users } from 'lucide-react'
import StudentAttendanceRegisterPanel from '@/pages/attendance/StudentAttendanceRegisterPanel'
import TeacherAttendanceRegisterPanel from '@/pages/attendance/TeacherAttendanceRegisterPanel'

// One shared "Attendance Register" screen for reviewing monthly attendance
// history of either students or teachers. Whoever holds BOTH attendance.view
// and teacherAttendance.view gets tabs to switch between them; holding just
// one skips the tabs and shows that register directly. The route itself
// requires at least one of the two permissions — see App.jsx — so this
// component is never reached by someone with neither.
export default function AttendanceRegister() {
  const { hasPermission } = useAuth()
  const canStudents = hasPermission('attendance.view')
  const canTeachers = hasPermission('teacherAttendance.view')

  if (canStudents && canTeachers) {
    return (
      <DashboardLayout title="Attendance Register">
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
            <StudentAttendanceRegisterPanel />
          </TabsContent>
          <TabsContent value="teachers">
            <TeacherAttendanceRegisterPanel />
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Attendance Register">
      {canTeachers ? <TeacherAttendanceRegisterPanel /> : <StudentAttendanceRegisterPanel />}
    </DashboardLayout>
  )
}
