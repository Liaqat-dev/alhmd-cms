import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import StudentDashboard from './pages/student/Dashboard'
import StudentTimetable from './pages/student/Timetable'
import StudentFees from './pages/student/Fees'
import StudentMarks from './pages/student/Marks'
import StudentReports from './pages/student/Reports'
import StudentProfile from './pages/student/Profile'
import { Toaster } from './components/ui/toaster'

function ProtectedRoute({ children }) {
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
          element={user ? <Navigate to="/" replace /> : <Login />}
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Student Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable"
          element={
            <ProtectedRoute>
              <StudentTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute>
              <StudentFees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marks"
          element={
            <ProtectedRoute>
              <StudentMarks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <StudentReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
