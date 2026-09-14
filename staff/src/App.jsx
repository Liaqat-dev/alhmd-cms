import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import RoleSwitch from './components/shared/RoleSwitch'
import Login from './pages/auth/Login'
import VerifyEmail from './pages/auth/VerifyEmail'
import CheckEmail from './pages/auth/CheckEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AdminDashboard from './pages/admin/Dashboard'
import TeacherDashboard from './pages/teacher/Dashboard'
import Students from './pages/admin/Students'
import AddStudent from './pages/admin/AddStudent'
import StudentProfile from './pages/admin/StudentProfile'
import Teachers from './pages/admin/Teachers'
import AddTeacher from './pages/admin/AddTeacher'
import TeacherProfile from './pages/admin/TeacherProfile'
import Classes from './pages/admin/Classes'
import Subjects from './pages/admin/Subjects'
import Announcements from './pages/admin/Announcements'
import Events from './pages/admin/Events'
import AdminTimetable from './pages/admin/Timetable'
import TeacherTimetable from './pages/teacher/Timetable'
import Fees from './pages/admin/Fees'
import AdminMarks from './pages/admin/Marks'
import TeacherMarks from './pages/teacher/Marks'
import Reports from './pages/Reports'
import AdminSalaries from './pages/admin/Salaries'
import TeacherSalaries from './pages/teacher/Salaries'
import AttendanceRegister from './pages/admin/AttendanceRegister'
import TeacherAttendance from './pages/admin/TeacherAttendance'
import MarkAttendance from './pages/MarkAttendance'
import Profile from './pages/Profile'
import Users from './pages/admin/Users'
import Roles from './pages/admin/Roles'
import Configurations from './pages/admin/Configurations'
import { Toaster } from './components/ui/toaster'

// `permission` (a string or array — ANY of them passes, same as the
// backend's requirePermission) gates fine-grained access to a shared
// resource. `adminOnly` is for the handful of pages with no permission
// catalog entry at all (the backend itself still hardcodes ADMIN there).
// Omit both for pages every authenticated staff member can reach (their own
// dashboard/profile/timetable/etc — RoleSwitch decides what they actually see).
function ProtectedRoute({ children, permission, adminOnly }) {
  const { user, loading, hasPermission } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role === 'STUDENT') {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  if (permission) {
    const names = Array.isArray(permission) ? permission : [permission]
    if (!hasPermission(...names)) {
      return <Navigate to="/" replace />
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
              ? <Navigate to="/" replace />
              : <Login />
          }
        />

        {/* Email verification & check-email — always public */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleSwitch admin={AdminDashboard} teacher={TeacherDashboard} />
            </ProtectedRoute>
          }
        />

        {/* Students */}
        <Route path="/students" element={<ProtectedRoute permission="students.view"><Students /></ProtectedRoute>} />
        <Route path="/students/:id/profile" element={<ProtectedRoute permission="students.view"><StudentProfile /></ProtectedRoute>} />
        <Route path="/students/add" element={<ProtectedRoute permission="students.create"><AddStudent /></ProtectedRoute>} />
        <Route path="/students/edit/:id" element={<ProtectedRoute permission="students.edit"><AddStudent /></ProtectedRoute>} />

        {/* Teachers */}
        <Route path="/teachers" element={<ProtectedRoute permission="teachers.view"><Teachers /></ProtectedRoute>} />
        <Route path="/teachers/:id/profile" element={<ProtectedRoute permission="teachers.view"><TeacherProfile /></ProtectedRoute>} />
        <Route path="/teachers/add" element={<ProtectedRoute permission="teachers.create"><AddTeacher /></ProtectedRoute>} />
        <Route path="/teachers/edit/:id" element={<ProtectedRoute permission="teachers.edit"><AddTeacher /></ProtectedRoute>} />

        <Route path="/classes" element={<ProtectedRoute permission="classes.view"><Classes /></ProtectedRoute>} />
        <Route path="/subjects" element={<ProtectedRoute permission="subjects.view"><Subjects /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute permission="announcements.view"><Announcements /></ProtectedRoute>} />

        {/* No permission catalog entry for these — backend still hardcodes ADMIN */}
        <Route path="/events" element={<ProtectedRoute adminOnly><Events /></ProtectedRoute>} />
        <Route path="/fees" element={<ProtectedRoute adminOnly><Fees /></ProtectedRoute>} />

        {/* Own-data pairs — content picked by role, no extra gate needed */}
        <Route path="/timetable" element={<ProtectedRoute><RoleSwitch admin={AdminTimetable} teacher={TeacherTimetable} /></ProtectedRoute>} />
        <Route path="/marks" element={<ProtectedRoute><RoleSwitch admin={AdminMarks} teacher={TeacherMarks} /></ProtectedRoute>} />
        <Route path="/salaries" element={<ProtectedRoute><RoleSwitch admin={AdminSalaries} teacher={TeacherSalaries} /></ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute permission="reports.view"><Reports /></ProtectedRoute>} />

        {/* Attendance — marking students and teachers is one shared screen;
            MarkAttendance itself decides tabs vs. a single panel based on
            which of the two permissions the user actually holds. */}
        <Route path="/mark-attendance" element={<ProtectedRoute permission={['attendance.create', 'teacherAttendance.create']}><MarkAttendance /></ProtectedRoute>} />
        <Route path="/mark-attendance/:classId" element={<ProtectedRoute permission={['attendance.create', 'teacherAttendance.create']}><MarkAttendance /></ProtectedRoute>} />
        <Route path="/attendance-register" element={<ProtectedRoute permission="attendance.view"><AttendanceRegister /></ProtectedRoute>} />
        <Route path="/teacher-attendance" element={<ProtectedRoute permission="teacherAttendance.view"><TeacherAttendance /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* RBAC control plane — see routes/users.js, routes/roles.js */}
        <Route path="/users" element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute permission="roles.view"><Roles /></ProtectedRoute>} />
        <Route path="/configurations" element={<ProtectedRoute adminOnly><Configurations /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
