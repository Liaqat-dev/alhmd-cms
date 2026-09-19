import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { attendanceAPI, teachersAPI, timetableAPI } from '@/services/api'
import { useClasses } from '@/hooks/useClasses'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import AttendanceRow from '@/components/shared/AttendanceRow'
import AttendanceSaveDialog from '@/components/shared/AttendanceSaveDialog'
import { PagePanel } from '@/components/shared/admin-table'
import { CheckCircle, Palmtree, Save, Users, CalendarDays, UserCheck, UserX } from 'lucide-react'

const JS_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getScheduledDatesInCurrentMonth(scheduledDays) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const result = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    if (scheduledDays.includes(JS_DAYS[date.getDay()])) {
      const mm = String(month + 1).padStart(2, '0')
      const dd = String(d).padStart(2, '0')
      result.push(`${year}-${mm}-${dd}`)
    }
  }
  return result
}

// Marks student attendance for a class. The only thing that differs by
// account: which classes you're allowed to pick from — every teacher (with
// attendance.create) sees just their own assigned classes, everyone else
// with the permission sees every class. The rest of the flow is identical.
export default function StudentAttendancePanel() {
  const { isTeacher } = useAuth()
  const { classId: classIdParam } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { classes: allClasses, classesLoading } = useClasses({ enabled: !isTeacher })

  const [myClasses, setMyClasses] = useState([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [scheduledDays, setScheduledDays] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [attendance, setAttendance] = useState([])
  const [markedDates, setMarkedDates] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const classes = isTeacher
    ? myClasses.map(c => ({ id: c.classId, name: c.className }))
    : allClasses

  const todayStr = new Date().toISOString().split('T')[0]

  const lectureDates = useMemo(
    () => scheduledDays.length > 0 ? getScheduledDatesInCurrentMonth(scheduledDays) : [],
    [scheduledDays]
  )

  const now = new Date()
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Teacher: load "my classes" once, then default the selection to the
  // route param (if any) or the first class.
  useEffect(() => {
    if (!isTeacher) return
    teachersAPI.getMyClasses().then(res => {
      const pairs = res.data.classes || []
      const classMap = new Map()
      pairs.forEach(p => {
        if (!classMap.has(p.classId)) classMap.set(p.classId, { classId: p.classId, className: p.className })
      })
      const unique = [...classMap.values()]
      setMyClasses(unique)
      if (unique.length > 0) {
        const initial = classIdParam
          ? unique.find(c => c.classId === parseInt(classIdParam))
          : null
        setSelectedClassId(initial ? initial.classId : unique[0].classId)
      }
    }).catch(() => setMyClasses([]))
  }, [isTeacher]) // eslint-disable-line react-hooks/exhaustive-deps

  // When class changes: load its timetable days, reset date
  useEffect(() => {
    if (!selectedClassId) {
      setScheduledDays([])
      setSelectedDate('')
      setAttendance([])
      setMarkedDates(new Set())
      return
    }
    setSelectedDate('')
    setAttendance([])
    setMarkedDates(new Set())
    timetableAPI.getByClass(selectedClassId).then(res => {
      const entries = res.data.entries || []
      const days = [...new Set(entries.map(t => t.dayOfWeek))]
      setScheduledDays(days)
    }).catch(() => setScheduledDays([]))
  }, [selectedClassId])

  // When date changes: load attendance
  useEffect(() => {
    if (selectedClassId && selectedDate) {
      void fetchAttendance()
    }
  }, [selectedClassId, selectedDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await attendanceAPI.getByClass(selectedClassId, { date: selectedDate })
      // Attendance defaults to present, so marking is only about the few who
      // were not. alreadySaved still reflects what the server actually holds,
      // so an untouched default never looks like an already-saved record.
      const records = response.data.attendance.map(a => ({
        ...a,
        alreadySaved: !!a.status,
        status: a.status || 'PRESENT',
      }))
      setAttendance(records)
      if (records.length > 0 && records.every(a => a.alreadySaved)) {
        setMarkedDates(prev => new Set([...prev, selectedDate]))
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch attendance' })
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = (studentId, status) => {
    setAttendance(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a))
  }

  const markAllPresent = () => setAttendance(prev => prev.map(a => ({ ...a, status: 'PRESENT' })))

  const handleSelectClass = (id) => {
    setSelectedClassId(id)
    if (isTeacher) navigate(`/mark-attendance/${id}`)
  }

  // Saving is one click on a roster that defaults to present, so the totals
  // get confirmed before anything is written.
  const requestSave = () => {
    const unmarked = attendance.filter(a => !a.status)
    if (unmarked.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Incomplete',
        description: `${unmarked.length} student${unmarked.length > 1 ? 's' : ''} not marked. Please mark all students before saving.`,
      })
      return
    }
    setConfirmOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await attendanceAPI.mark({
        date: selectedDate,
        classId: selectedClassId,
        attendances: attendance.map(a => ({
          studentId: a.studentId,
          status: a.status,
        })),
      })
      setMarkedDates(prev => new Set([...prev, selectedDate]))
      setAttendance(prev => prev.map(a => ({ ...a, alreadySaved: true })))
      setConfirmOpen(false)
      toast({ title: 'Success', description: `Attendance saved for ${attendance.length} students` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save attendance',
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const presentCount = attendance.filter(a => a.status === 'PRESENT').length
  const absentCount = attendance.filter(a => a.status === 'ABSENT').length
  const leaveCount = attendance.filter(a => a.status === 'LEAVE').length

  return (
    <div className="space-y-6">

      {/* Controls */}
      <div className="w-full flex flex-row justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap">
          <Select value={selectedClassId} onValueChange={handleSelectClass} disabled={classesLoading}>
            <SelectTrigger className="col-span-2 w-full sm:col-span-1 sm:w-35">
              <SelectValue placeholder={classesLoading ? 'Loading…' : 'Select class'} />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Cards */}
      {selectedClassId && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {monthLabel}
          </h3>

          {scheduledDays.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/30">
              <CalendarDays className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <p className="text-sm text-muted-foreground">No timetable found for this class.</p>
            </div>
          ) : lectureDates.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/30">
              <CalendarDays className="h-5 w-5 text-muted-foreground/50 shrink-0" />
              <p className="text-sm text-muted-foreground">No lectures scheduled in the current month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
              {lectureDates.map(dateStr => {
                const date = new Date(dateStr + 'T00:00:00')
                const isPast = dateStr <= todayStr
                const isSelected = selectedDate === dateStr
                const isMarked = markedDates.has(dateStr)

                return (
                  <button
                    key={dateStr}
                    disabled={!isPast}
                    onClick={() => setSelectedDate(dateStr)}
                    className={[
                      'relative flex flex-col items-center w-full sm:w-16 py-2 px-0.5 sm:py-2.5 sm:px-1 rounded-lg sm:rounded-xl border transition-all',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                        : isMarked
                        ? 'bg-emerald-50 border-emerald-300 hover:border-emerald-400 cursor-pointer'
                        : isPast
                        ? 'bg-card border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                        : 'bg-muted/40 border-border/40 text-muted-foreground/40 cursor-not-allowed opacity-50',
                    ].join(' ')}
                  >
                    {isMarked && !isSelected && (
                      <CheckCircle className="absolute -top-1.5 -right-1.5 h-4 w-4 text-emerald-500 bg-white rounded-full" />
                    )}
                    <span className={`text-[9px] sm:text-[10px] font-medium uppercase tracking-wide mb-0.5 ${isSelected ? 'text-primary-foreground/70' : isMarked ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {SHORT_DAYS[date.getDay()]}
                    </span>
                    <span className={`text-base sm:text-xl font-bold leading-none ${isSelected ? 'text-primary-foreground' : isMarked ? 'text-emerald-700' : isPast ? 'text-foreground' : ''}`}>
                      {date.getDate()}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/70' : isMarked ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {SHORT_MONTHS[date.getMonth()]}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

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

      {/* Attendance Grid */}
      <PagePanel
        icon={CalendarDays}
        title={selectedClass?.name || 'Select a Class'}
        count={attendance.length}
        countLabel={selectedDate
          ? `students · ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
          }).toUpperCase()}`
          : 'students'}
      >
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <CalendarDays className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {!selectedClassId ? 'Select a class' : 'Select a date'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {!selectedClassId
                  ? 'Choose a class from the dropdown above.'
                  : 'Pick a lecture date from the cards above to load attendance.'}
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                  <div className="h-4 w-16 bg-muted rounded" />
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
              <h3 className="text-lg font-semibold mb-1">No students found</h3>
              <p className="text-sm text-muted-foreground">No students are enrolled in this class yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map(student => (
                <AttendanceRow
                  key={student.studentId}
                  name={student.name}
                  subtitle={student.rollNumber}
                  profilePicUrl={student.profilePicUrl}
                  status={student.status}
                  readOnly={student.alreadySaved}
                  onChange={next => updateStatus(student.studentId, next)}
                />
              ))}

              {!markedDates.has(selectedDate) && (
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
        subtitle={[selectedClass?.name, selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        })].filter(Boolean).join(' · ')}
        present={presentCount}
        absent={absentCount}
        leave={leaveCount}
        total={attendance.length}
        noun="student"
        saving={saving}
        onConfirm={handleSave}
      />

    </div>
  )
}
