import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { attendanceAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import AttendanceRow from '@/components/shared/AttendanceRow'
import AttendanceSaveDialog from '@/components/shared/AttendanceSaveDialog'
import { PagePanel } from '@/components/shared/admin-table'
import { CheckCircle, Palmtree, Save, Users, CalendarDays, UserCheck, UserX } from 'lucide-react'

export default function TeacherAttendancePanel() {
  const { toast } = useToast()

  const now = new Date()
  const todayStr = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')

  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (selectedDate) void fetchAttendance()
  }, [selectedDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await attendanceAPI.getTeachersByDate({ date: selectedDate })
      const records = response.data.attendance
      // Whether the day is already on record has to be read before defaulting,
      // otherwise every unsaved day would look saved.
      setAlreadySaved(records.length > 0 && records.every(a => !!a.status))
      // Attendance defaults to present, so marking is only about who was not.
      setAttendance(records.map(a => ({ ...a, status: a.status || 'PRESENT' })))
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

  // Saving is one click on a roster that defaults to present, so the totals
  // get confirmed before anything is written.
  const requestSave = () => {
    const unmarked = attendance.filter(a => !a.status)
    if (unmarked.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete',
        description: `${unmarked.length} teacher${unmarked.length > 1 ? 's' : ''} not marked. Please mark all teachers before saving.`,
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await attendanceAPI.markTeachers({
        date: selectedDate,
        attendances: attendance.map(a => ({ teacherId: a.teacherId, status: a.status })),
      })
      setAlreadySaved(true)
      setConfirmOpen(false)
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

  return (
    <div className="space-y-6">

      {/* Date */}
      <div className="w-full flex flex-row justify-between gap-3 flex-wrap">
        <Input
          type="date"
          value={selectedDate}
          max={todayStr}
          onChange={e => { setSelectedDate(e.target.value); setAlreadySaved(false) }}
          className="w-40 sm:w-45"
        />
      </div>

      {/* Quick Stats */}
      {attendance.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Class names are written out in full: Tailwind only generates what
              it can see in the source, so a composed `text-${color}-600` never
              makes it into the stylesheet. */}
          {[
            { label: 'Total',   count: attendance.length, icon: Users, tint: 'bg-muted',         iconColor: 'text-muted-foreground', countColor: '' },
            { label: 'Present', count: presentCount, icon: UserCheck, tint: 'bg-emerald-500/10', iconColor: 'text-emerald-600', countColor: 'text-emerald-700' },
            { label: 'Absent',  count: absentCount,  icon: UserX,     tint: 'bg-rose-500/10',    iconColor: 'text-rose-600',    countColor: 'text-rose-700' },
            { label: 'Leave',   count: leaveCount,   icon: Palmtree,  tint: 'bg-amber-500/10',   iconColor: 'text-amber-600',   countColor: 'text-amber-700' },
          ].map(({ label, count, icon: Icon, tint, iconColor, countColor }) => (
            // Stacked and centred on phones so four fit across; the original
            // icon-beside-text row returns as soon as there is width for it.
            <div key={label} className={`flex flex-row items-center text-center ${tint} gap-0.5 p-0.5 card sm:flex-row sm:items-center sm:text-left sm:gap-1 sm:p-2`}>
              <div className={`h-7 w-7 sm:h-8 sm:w-8 shrink-0  flex items-center justify-center`}>
                <Icon className={`h-5 w-5 sm:h-8 sm:w-8 ${iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] sm:text-xs text-muted-foreground font-medium leading-tight">{label}</p>
                <p className={`text-base sm:text-lg font-bold leading-tight ${countColor}`}>{count}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendance list */}
      <PagePanel
        icon={CalendarDays}
        title={new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        }).toUpperCase()}
        count={attendance.length}
        countLabel="teachers"
      >
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
              {attendance.map(teacher => (
                <AttendanceRow
                  key={teacher.teacherId}
                  name={teacher.name}
                  profilePicUrl={teacher.profilePicUrl}
                  status={teacher.status}
                  readOnly={alreadySaved}
                  onChange={next => updateStatus(teacher.teacherId, next)}
                />
              ))}

              {!alreadySaved && (
                <div className="flex flex-wrap gap-2 items-center pt-3">
                  <Button variant="outline" onClick={markAllPresent} size="sm" className="gap-1.5 h-9">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> All Present
                  </Button>
                  <Button onClick={requestSave} disabled={saving} className="ml-auto gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          )}
      </PagePanel>

      {/* Confirm totals before writing */}
      <AttendanceSaveDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        subtitle={new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        })}
        present={presentCount}
        absent={absentCount}
        leave={leaveCount}
        total={attendance.length}
        noun="teacher"
        saving={saving}
        onConfirm={handleSave}
      />

    </div>
  )
}
