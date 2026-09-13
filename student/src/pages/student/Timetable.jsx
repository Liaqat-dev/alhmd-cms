import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import TimetableView from '@/components/shared/TimetableView'
import { dashboardAPI } from '@/services/api'
import { ChevronDown } from 'lucide-react'
import { useEffect } from 'react'

export default function StudentTimetable() {
  const [classes, setClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await dashboardAPI.getStudentDashboard()
        console.log('Full response:', response)
        const enrolledClasses = response.data?.enrolledClasses || response?.enrolledClasses || []
        console.log('Enrolled classes array:', enrolledClasses)
        console.log('Number of classes:', enrolledClasses.length)
        setClasses(enrolledClasses)
        if (enrolledClasses.length > 0) {
          console.log('Setting selectedClassId to:', enrolledClasses[0].id)
          setSelectedClassId(enrolledClasses[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch classes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [])

  return (
    <DashboardLayout title="My Timetable">
      {!loading && classes.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-900 mb-2">Select Class</label>
          <div className="relative max-w-xs">
            <select
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer hover:border-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}
      <TimetableView title="Class Timetable" classId={selectedClassId} />
    </DashboardLayout>
  )
}
