import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://cga-backend-jl8m.onrender.com/api'

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly refresh-token cookie on every request
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach in-memory access token ─────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: transparent access-token refresh on 401 ─────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  )
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        clearAccessToken()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue any concurrent requests to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true, timeout: 30000 }
        )
        const { accessToken } = response.data
        setAccessToken(accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAccessToken()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  getProfile: () => api.get('/auth/profile'),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  changePassword: (data) => api.post('/auth/change-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPasswordWithToken: (data) => api.post('/auth/reset-password-token', data),
  uploadProfilePic: (formData) => api.post('/auth/profile-pic', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteProfilePic: () => api.delete('/auth/profile-pic'),
}

// Dashboard API
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getTeacherStats: () => api.get('/dashboard/teacher'),
  getStudentDashboard: () => api.get('/dashboard/student'),
}

// Students API
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getById: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  getByClass: (classId) => api.get(`/students/class/${classId}`),
  getDocuments: (id) => api.get(`/students/${id}/documents`),
  uploadDocument: (id, type, file) => {
    const formData = new FormData()
    formData.append('type', type)
    formData.append('document', file)
    return api.post(`/students/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteDocument: (id, docId) => api.delete(`/students/${id}/documents/${docId}`),
  getDocumentFile: (id, docId) => api.get(`/students/${id}/documents/${docId}/file`, { responseType: 'blob' }),
}

// Teachers API
export const teachersAPI = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  getMyClasses: () => api.get('/teachers/my-classes'),
}

// Classes API
export const classesAPI = {
  getAllBatches: () => api.get('/classes/all'), // returns all classes with subjects
  getAll: (params) => api.get('/classes', { params }),
  getById: (id) => api.get(`/classes/${id}`),
  create: (data) => api.post('/classes', data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  delete: (id) => api.delete(`/classes/${id}`),
  addSubject: (id, data) => api.post(`/classes/${id}/subjects`, data),
  removeSubject: (subjectId) => api.delete(`/classes/subjects/${subjectId}`),
}

// Attendance API
export const attendanceAPI = {
  mark: (data) => api.post('/attendance/mark', data),
  getByClass: (classId, params) => api.get(`/attendance/class/${classId}`, { params }),
  getClassReport: (classId, params) => api.get(`/attendance/class/${classId}/report`, { params }),
  getStudentAttendance: (studentId, params) => api.get(`/attendance/student/${studentId}`, { params }),
  getMyAttendance: (params) => api.get('/attendance/my-attendance', { params }),
  getClassGrid: (classId, params) => api.get(`/attendance/class/${classId}/grid`, { params }),
  markTeachers: (data) => api.post('/attendance/mark-teachers', data),
  getTeachersByDate: (params) => api.get('/attendance/teachers', { params }),
  getTeacherReport: (params) => api.get('/attendance/teachers/report', { params }),
  getTeacherGrid: (params) => api.get('/attendance/teachers/grid', { params }),
}

// Subjects API
export const subjectsAPI = {
  getAll: (params) => api.get('/subjects', { params }),
  getById: (id) => api.get(`/subjects/${id}`),
  create: (data) => api.post('/subjects', data),
  bulkCreate: (data) => api.post('/subjects/bulk', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
}

// Payment Info API
export const paymentInfoAPI = {
  getAll: () => api.get('/payment-info'),
  getById: (id) => api.get(`/payment-info/${id}`),
  create: (data) => api.post('/payment-info', data),
  update: (id, data) => api.put(`/payment-info/${id}`, data),
  delete: (id) => api.delete(`/payment-info/${id}`),
}

// Announcements API
export const announcementsAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  getById: (id) => api.get(`/announcements/${id}`),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  toggle: (id) => api.patch(`/announcements/${id}/toggle`),
}

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getUpcoming: () => api.get('/events/upcoming'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
}

// Timetable API
export const timetableAPI = {
  getMyTimetable: () => api.get('/timetable/my-timetable'),
  getByClass: (classId) => api.get(`/timetable/class/${classId}`),
  getByTeacher: (teacherId) => api.get(`/timetable/teacher/${teacherId}`),
  create: (data) => api.post('/timetable', data),
  update: (id, data) => api.put(`/timetable/${id}`, data),
  delete: (id) => api.delete(`/timetable/${id}`),
  clearClass: (classId) => api.delete(`/timetable/class/${classId}/clear`),
}

// Fee Challan API
export const feesAPI = {
  getAll: (params) => api.get('/fees', { params }),
  getById: (id) => api.get(`/fees/${id}`),
  getStatistics: (params) => api.get('/fees/statistics', { params }),
  getPaymentHistory: (params) => api.get('/fees/payment-history', { params }),
  generate: (data) => api.post('/fees/generate', data),
  generateClass: (data) => api.post('/fees/generate-class', data),
  updatePayment: (id, data) => api.put(`/fees/${id}/payment`, data),
  updateOverdue: () => api.post('/fees/update-overdue'),
  delete: (id) => api.delete(`/fees/${id}`),
  getMyChallans: () => api.get('/fees/my-challans'),
  getStudentChallans: (studentId) => api.get(`/fees/student/${studentId}`),
  downloadPDF: (id) => api.get(`/fees/${id}/pdf`, { responseType: 'blob' }),
}

// Student Expenses API
export const studentExpensesAPI = {
  getByStudent: (studentId) => api.get('/student-expenses', { params: { studentId } }),
  create: (data) => api.post('/student-expenses', data),
  update: (id, data) => api.put(`/student-expenses/${id}`, data),
  delete: (id) => api.delete(`/student-expenses/${id}`),
}

// Marks/Assessment API
export const marksAPI = {
  // Exams
  getExams: (params) => api.get('/marks/exams', { params }),
  getTeacherExams: () => api.get('/marks/exams/teacher'),
  getExamById: (id) => api.get(`/marks/exams/${id}`),
  createExam: (data) => api.post('/marks/exams', data),
  updateExam: (id, data) => api.put(`/marks/exams/${id}`, data),
  deleteExam: (id) => api.delete(`/marks/exams/${id}`),
  // Marks entry
  enterMarks: (data) => api.post('/marks/enter', data),
  getClassMarks: (examId) => api.get(`/marks/class/${examId}`),
  // Student marks
  getMyMarks: (params) => api.get('/marks/my-marks', { params }),
  getMySubjectMarks: () => api.get('/marks/my-marks/subjects'),
  getStudentMarks: (studentId, params) => api.get(`/marks/student/${studentId}`, { params }),
  getStudentSubjectMarks: (studentId) => api.get(`/marks/student/${studentId}/subjects`),
}

// Salaries API
export const salariesAPI = {
  getAll: (params) => api.get('/salaries', { params }),
  getById: (id) => api.get(`/salaries/${id}`),
  getStatistics: (params) => api.get('/salaries/statistics', { params }),
  calculate: (teacherId) => api.get(`/salaries/calculate/${teacherId}`),
  generateAll: (data) => api.post('/salaries/generate', data),
  generateSingle: (teacherId, data) => api.post(`/salaries/generate/${teacherId}`, data),
  getTeacherHistory: (teacherId) => api.get(`/salaries/teacher/${teacherId}`),
  updateStatus: (id, data) => api.put(`/salaries/${id}/status`, data),
  delete: (id) => api.delete(`/salaries/${id}`),
}

// Reports API
export const reportsAPI = {
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  generate: (data) => api.post('/reports/generate', data),
  generateClass: (data) => api.post('/reports/generate-class', data),
  updateRemarks: (id, data) => api.put(`/reports/${id}/remarks`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  getMyReports: () => api.get('/reports/my-reports'),
  getStudentReports: (studentId) => api.get(`/reports/student/${studentId}`),
  getClassSummary: (params) => api.get('/reports/class-summary', { params }),
}

// Users API (Admin/Teacher accounts — students are not part of RBAC)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  assignRoles: (id, roleIds) => api.put(`/users/${id}/roles`, { roleIds }),
}

// Roles & Permissions API
export const rolesAPI = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  getAllPermissions: () => api.get('/roles/permissions/all'),
}
