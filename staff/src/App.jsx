import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'
import CheckEmail from './pages/auth/CheckEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AddStudent from './pages/admin/AddStudent'
import AdminStudentProfile from './pages/admin/StudentProfile'
import AdminTeachers from './pages/admin/Teachers'
import AddTeacher from './pages/admin/AddTeacher'
import AdminTeacherProfile from './pages/admin/TeacherProfile'
import AdminClasses from './pages/admin/Classes'
import AdminSubjects from './pages/admin/Subjects'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminEvents from './pages/admin/Events'
import AdminTimetable from './pages/admin/Timetable'
import AdminFees from './pages/admin/Fees'
import AdminMarks from './pages/admin/Marks'
import AdminReports from './pages/admin/Reports'
import AdminSalaries from './pages/admin/Salaries'
import AdminAttendanceRegister from './pages/admin/AttendanceRegister'
import TeacherAttendanceRegister from './pages/admin/AttendanceRegister'
import AdminTeacherAttendance from './pages/admin/TeacherAttendance'
import AdminMarkAttendance from './pages/admin/MarkAttendance'
import MarkTeacherAttendance from './pages/admin/MarkTeacherAttendance'
import AdminProfile from './pages/admin/Profile'
import AdminUsers from './pages/admin/Users'
import AdminRoles from './pages/admin/Roles'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherMarks from './pages/teacher/Marks'
import TeacherAttendance from './pages/teacher/Attendance'
import TeacherTimetable from './pages/teacher/Timetable'
import TeacherProfile from './pages/teacher/Profile'
import TeacherReports from './pages/teacher/Reports'
import TeacherSalaries from './pages/teacher/Salaries'
import { Toaster } from './components/ui/toaster'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'ADMIN':
        return <Navigate to="/admin" replace />
      case 'TEACHER':
        return <Navigate to="/teacher" replace />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return children
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            user && user.role !== 'STUDENT'
              ? <Navigate to={`/${user.role.toLowerCase()}`} replace />
              : <Login />
          }
        />

        {/* Email verification & check-email — always public */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/:id/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminStudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/add"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AddStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AddStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/:id/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/add"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AddTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/edit/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AddTeacher />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/subjects"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSubjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAnnouncements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/timetable"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/marks"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/salaries"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminSalaries />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mark-attendance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminMarkAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAttendanceRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teacher-attendance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mark-teacher-attendance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MarkTeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminRoles />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/attendance/:classId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/class-register"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherAttendanceRegister />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/mark-teacher-attendance"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <MarkTeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/timetable"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/marks"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/reports"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/salaries"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherSalaries />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
