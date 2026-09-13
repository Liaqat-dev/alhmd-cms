import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { attendanceAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Palmtree, Save, Users, CalendarDays, UserCheck, UserX } from 'lucide-react'

export default function MarkTeacherAttendance() {
  const { toast } = useToast()

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alreadySaved, setAlreadySaved] = useState(false)

  useEffect(() => {
    if (selectedDate) void fetchAttendance()
  }, [selectedDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await attendanceAPI.getTeachersByDate({ date: selectedDate })
      const records = response.data.attendance
      setAttendance(records)
      setAlreadySaved(records.length > 0 && records.every(a => !!a.status))
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch teacher attendance' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (teacherId, status) => {
    setAttendance(prev => prev.map(a => a.teacherId === teacherId ? { ...a, status } : a))
  }

  const markAllPresent = () => setAttendance(prev => prev.map(a => ({ ...a, status: 'PRESENT' })))
  const markAllAbsent = () => setAttendance(prev => prev.map(a => ({ ...a, status: 'ABSENT' })))

  const handleSave = async () => {
    const unmarked = attendance.filter(a => !a.status)
    if (unmarked.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete',
        description: `${unmarked.length} teacher${unmarked.length > 1 ? 's' : ''} not marked. Please mark all teachers before saving.`,
      })
      return
    }

    setSaving(true)
    try {
      await attendanceAPI.markTeachers({
        date: selectedDate,
        attendances: attendance.map(a => ({ teacherId: a.teacherId, status: a.status })),
      })
      setAlreadySaved(true)
      toast({ title: 'Success', description: `Attendance saved for ${attendance.length} teachers` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save teacher attendance',
      })
    } finally {
      setSaving(false)
    }
  }

  const presentCount = attendance.filter(a => a.status === 'PRESENT').length
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length
  const leaveCount = attendance.filter(a => a.status === 'LEAVE').length
  const unmarkedCount = attendance.filter(a => !a.status).length

  return (
    <DashboardLayout title="Mark Teacher Attendance">
      <div className="space-y-6">

        {/* Date picker */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 w-52">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={e => { setSelectedDate(e.target.value); setAlreadySaved(false) }}
                />
              </div>

              {!alreadySaved && attendance.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={markAllPresent} size="sm" className="gap-1.5 h-9">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> All Present
                  </Button>
                  <Button variant="outline" onClick={markAllAbsent} size="sm" className="gap-1.5 h-9">
                    <XCircle className="h-3.5 w-3.5 text-rose-600" /> All Absent
                  </Button>
                </div>
              )}

              {!alreadySaved && attendance.length > 0 && (
                <Button onClick={handleSave} disabled={saving} className="ml-auto gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {attendance.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Present', count: presentCount, icon: UserCheck, color: 'emerald' },
              { label: 'Absent',  count: absentCount,  icon: UserX,    color: 'rose' },
              { label: 'Leave',   count: leaveCount,   icon: Palmtree, color: 'amber' },
              { label: 'Total',   count: attendance.length, icon: Users, color: 'muted' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="flex items-center gap-3 p-3.5 card">
                <div className={`h-10 w-10 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className={`text-xl font-bold ${color !== 'muted' ? `text-${color}-700` : ''}`}>{count}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attendance list */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </div>
                </CardTitle>
              </div>
              {unmarkedCount > 0 && attendance.length > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {unmarkedCount} unmarked
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="ml-auto flex gap-2">
                      <div className="h-8 w-8 bg-muted rounded-lg" />
                      <div className="h-8 w-8 bg-muted rounded-lg" />
                      <div className="h-8 w-8 bg-muted rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No teachers found</h3>
                <p className="text-sm text-muted-foreground">No teachers exist in the system yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendance.map((teacher, index) => (
                  <div
                    key={teacher.teacherId}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 rounded-xl border transition-colors ${
                      teacher.status === 'PRESENT' ? 'bg-emerald-50/50 border-emerald-200/60'
                      : teacher.status === 'ABSENT' ? 'bg-rose-50/50 border-rose-200/60'
                      : teacher.status === 'LEAVE' ? 'bg-amber-50/50 border-amber-200/60'
                      : 'bg-card border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 sm:flex-1">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        teacher.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700'
                        : teacher.status === 'ABSENT' ? 'bg-rose-100 text-rose-700'
                        : teacher.status === 'LEAVE' ? 'bg-amber-100 text-amber-700'
                        : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{teacher.name}</p>
                      </div>
                    </div>

                    {alreadySaved ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          teacher.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-700'
                          : teacher.status === 'ABSENT' ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            teacher.status === 'PRESENT' ? 'bg-emerald-500'
                            : teacher.status === 'ABSENT' ? 'bg-rose-500'
                            : 'bg-amber-500'
                          }`} />
                          {teacher.status}
                        </span>
                        <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1.5 shrink-0">
                        {[
                          { s: 'PRESENT', icon: CheckCircle, active: 'bg-emerald-500 text-white shadow-sm shadow-emerald-200', hover: 'hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600' },
                          { s: 'ABSENT',  icon: XCircle,    active: 'bg-rose-500 text-white shadow-sm shadow-rose-200',   hover: 'hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600' },
                          { s: 'LEAVE',   icon: Palmtree,      active: 'bg-amber-500 text-white shadow-sm shadow-amber-200', hover: 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600' },
                        ].map(({ s, icon: Icon, active, hover }) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateStatus(teacher.teacherId, s)}
                            className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                              teacher.status === s
                                ? active
                                : `bg-background border border-border ${hover} text-muted-foreground`
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
