import {useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {attendanceAPI, teachersAPI, timetableAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {CalendarDays, CheckCircle, Palmtree, Save, UserCheck, Users, UserX, XCircle} from 'lucide-react'

const JS_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Returns all dates (YYYY-MM-DD) in the current month that fall on any of the given day names
function getScheduledDatesInCurrentMonth(scheduledDays) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result = []
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d)
        const dayName = JS_DAYS[date.getDay()]
        if (scheduledDays.includes(dayName)) {
            const mm = String(month + 1).padStart(2, '0')
            const dd = String(d).padStart(2, '0')
            result.push(`${year}-${mm}-${dd}`)
        }
    }
    return result
}

export default function TeacherAttendance() {
    const {classId} = useParams()
    const navigate = useNavigate()
    const {toast} = useToast()

    // ── Class list (deduped from subject-class pairs) ──
    const [myClasses, setMyClasses] = useState([])
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedDate, setSelectedDate] = useState('')
    const [scheduledDays, setScheduledDays] = useState([])
    const [attendance, setAttendance] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [markedDates, setMarkedDates] = useState(new Set())

    const lectureDates = useMemo(
        () => (scheduledDays.length > 0 ? getScheduledDatesInCurrentMonth(scheduledDays) : []),
        [scheduledDays]
    )

    const todayStr = new Date().toISOString().split('T')[0]

    useEffect(() => {
        void fetchClasses()
    }, [])

    // When the selected class changes, fetch its timetable days and reset the date
    useEffect(() => {
        if (!selectedClassId) return
        setSelectedDate('')
        setAttendance([])
        setMarkedDates(new Set())
        timetableAPI.getByClass(selectedClassId).then(res => {
            const entries = res.data.entries || []
            const days = [...new Set(entries.map(t => t.dayOfWeek))]
            setScheduledDays(days)
        }).catch(() => setScheduledDays([]))
    }, [selectedClassId])

    useEffect(() => {
        if (selectedClassId && selectedDate) {
            void fetchAttendance()
        }
    }, [selectedClassId, selectedDate])

    const fetchClasses = async () => {
        try {
            const response = await teachersAPI.getMyClasses()
            const pairs = response.data.classes
            const classMap = new Map()
            pairs.forEach(p => {
                if (!classMap.has(p.classId)) classMap.set(p.classId, {classId: p.classId, className: p.className})
            })
            const uniqueClasses = [...classMap.values()]
            setMyClasses(uniqueClasses)
            if (uniqueClasses.length > 0) {
                const initial = classId
                    ? uniqueClasses.find(c => c.classId === parseInt(classId))
                    : null
                setSelectedClassId(initial ? initial.classId : uniqueClasses[0].classId)
            }
        } catch (error) {
            console.error('Failed to fetch classes:', error)
        }
    }

    const fetchAttendance = async () => {
        setLoading(true)
        try {
            const response = await attendanceAPI.getByClass(selectedClassId, {date: selectedDate})
            const records = response.data.attendance.map(a => ({...a, alreadySaved: !!a.status}))
            setAttendance(records)
            if (records.length > 0 && records.every(a => a.alreadySaved)) {
                setMarkedDates(prev => new Set([...prev, selectedDate]))
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch attendance',
            })
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = (studentId, status) => {
        setAttendance(prev =>
            prev.map(a => a.studentId === studentId ? {...a, status} : a)
        )
    }

    const markAllPresent = () => setAttendance(prev => prev.map(a => ({...a, status: 'PRESENT'})))
    const markAllAbsent = () => setAttendance(prev => prev.map(a => ({...a, status: 'ABSENT'})))

    const handleSave = async () => {
        const unmarked = attendance.filter(a => !a.status)
        if (unmarked.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Incomplete',
                description: `${unmarked.length} student${unmarked.length > 1 ? 's' : ''} not marked. Please mark all students before saving.`,
            })
            return
        }

        const attendanceData = attendance.map(a => ({
            studentId: a.studentId,
            status: a.status,
        }))

        setSaving(true)
        try {
            await attendanceAPI.mark({
                date: selectedDate,
                classId: selectedClassId,
                attendances: attendanceData,
            })
            setMarkedDates(prev => new Set([...prev, selectedDate]))
            setAttendance(prev => prev.map(a => ({...a, alreadySaved: true})))
            toast({
                title: 'Success',
                description: `Attendance saved for ${attendanceData.length} students`,
            })
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.errors?.message || 'Failed to save attendance',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSelectionChange = (id) => {
        setSelectedClassId(id)
        navigate(`/teacher/attendance/${id}`)
    }

    const selectedClass = myClasses.find(c => c.classId === selectedClassId)
    const presentCount = attendance.filter(a => a.status === 'PRESENT').length
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length
    const leaveCount = attendance.filter(a => a.status === 'LEAVE').length
    const unmarkedCount = attendance.filter(a => !a.status).length

    // Current month label for the cards section
    const now = new Date()
    const monthLabel = now.toLocaleDateString('en-US', {month: 'long', year: 'numeric'})

    return (
        <DashboardLayout title="Mark Attendance">
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-5">
                        <div className="space-y-1.5 w-full xs:w-72">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Class</Label>
                            <Select value={selectedClassId} onValueChange={handleSelectionChange}>
                                <SelectTrigger className="w-full xs:w-72">
                                    <SelectValue placeholder="Select class"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {myClasses.map((cls) => (
                                        <SelectItem key={cls.classId} value={cls.classId}>
                                            {cls.className}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Date Cards */}
                {selectedClassId && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-muted-foreground"/>
                                {monthLabel}
                            </h3>
                            {scheduledDays.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                      Scheduled on: {scheduledDays.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')}
                    </span>
                            )}
                        </div>

                        {scheduledDays.length === 0 ? (
                            <div
                                className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/30">
                                <CalendarDays className="h-5 w-5 text-muted-foreground/50 shrink-0"/>
                                <p className="text-sm text-muted-foreground">No timetable found for this class. No
                                    scheduled lectures this month.</p>
                            </div>
                        ) : lectureDates.length === 0 ? (
                            <div
                                className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/30">
                                <CalendarDays className="h-5 w-5 text-muted-foreground/50 shrink-0"/>
                                <p className="text-sm text-muted-foreground">No lectures scheduled in the current
                                    month.</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {lectureDates.map((dateStr) => {
                                    const date = new Date(dateStr + 'T00:00:00')
                                    const isPast = dateStr <= todayStr
                                    const isSelected = selectedDate === dateStr
                                    const isMarked = markedDates.has(dateStr)
                                    const dayIndex = date.getDay()

                                    return (
                                        <button
                                            key={dateStr}
                                            disabled={!isPast}
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={[
                                                'relative flex flex-col items-center w-16 py-2.5 px-1 rounded-xl border transition-all',
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
                                                <CheckCircle
                                                    className="absolute -top-1.5 -right-1.5 h-4 w-4 text-emerald-500 bg-white rounded-full"/>
                                            )}
                                            <span
                                                className={`text-[10px] font-medium uppercase tracking-wide mb-0.5 ${isSelected ? 'text-primary-foreground/70' : isMarked ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {SHORT_DAYS[dayIndex]}
                          </span>
                                            <span
                                                className={`text-xl font-bold leading-none ${isSelected ? 'text-primary-foreground' : isMarked ? 'text-emerald-700' : isPast ? 'text-foreground' : ''}`}>
                            {date.getDate()}
                          </span>
                                            <span
                                                className={`text-[10px] mt-0.5 ${isSelected ? 'text-primary-foreground/70' : isMarked ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                            {SHORT_MONTHS[date.getMonth()]}
                          </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Action buttons — only visible once a date is picked and not fully marked */}
                {selectedDate && !markedDates.has(selectedDate) && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button variant="outline" onClick={markAllPresent} size="sm" className="gap-1.5 h-9">
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600"/>
                            All Present
                        </Button>
                        <Button variant="outline" onClick={markAllAbsent} size="sm" className="gap-1.5 h-9">
                            <XCircle className="h-3.5 w-3.5 text-rose-600"/>
                            All Absent
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="ml-auto gap-2">
                            <Save className="h-4 w-4"/>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                )}

                {/* Quick Stats */}
                {attendance.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center gap-3 p-3.5 card">
                            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <UserCheck className="h-5 w-5 text-emerald-600"/>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Present</p>
                                <p className="text-xl font-bold text-emerald-700">{presentCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3.5 card">
                            <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                <UserX className="h-5 w-5 text-rose-600"/>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Absent</p>
                                <p className="text-xl font-bold text-rose-700">{absentCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3.5 card">
                            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Palmtree className="h-5 w-5 text-amber-600"/>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Leave</p>
                                <p className="text-xl font-bold text-amber-700">{leaveCount}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3.5 card">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Users className="h-5 w-5 text-muted-foreground"/>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Total</p>
                                <p className="text-xl font-bold">{attendance.length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Grid */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <CalendarDays className="h-4 w-4 text-primary"/>
                                    </div>
                                    <div>{selectedClass?.className || 'Select a Class'}</div>
                                </CardTitle>
                                {selectedDate && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </p>
                                )}
                            </div>
                            {unmarkedCount > 0 && attendance.length > 0 && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"/>
                                    {unmarkedCount} unmarked
                    </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedDate ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div
                                    className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                                    <CalendarDays className="h-8 w-8 text-muted-foreground/60"/>
                                </div>
                                <h3 className="text-lg font-semibold mb-1">Select a date</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Pick a lecture date from the cards above to load attendance.
                                </p>
                            </div>
                        ) : loading ? (
                            <div className="space-y-3">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i}
                                         className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                                        <div className="h-4 w-16 bg-muted rounded"/>
                                        <div className="h-4 w-32 bg-muted rounded"/>
                                        <div className="ml-auto flex gap-2">
                                            <div className="h-8 w-8 bg-muted rounded-lg"/>
                                            <div className="h-8 w-8 bg-muted rounded-lg"/>
                                            <div className="h-8 w-8 bg-muted rounded-lg"/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : attendance.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div
                                    className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                                    <Users className="h-8 w-8 text-muted-foreground/60"/>
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No students found</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    No students are enrolled in this class yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {attendance.map((student, index) => (
                                    <div
                                        key={student.studentId}
                                        className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                                            student.status === 'PRESENT'
                                                ? 'bg-emerald-50/50 border-emerald-200/60'
                                                : student.status === 'ABSENT'
                                                    ? 'bg-rose-50/50 border-rose-200/60'
                                                    : student.status === 'LEAVE'
                                                        ? 'bg-amber-50/50 border-amber-200/60'
                                                        : 'bg-card border-border'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                                    student.status === 'PRESENT'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : student.status === 'ABSENT'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : student.status === 'LEAVE'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{student.name}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{student.rollNumber}</p>
                                            </div>
                                        </div>

                                        {student.alreadySaved ? (
                                            <div className="flex items-center gap-2 shrink-0">
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                    student.status === 'PRESENT'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : student.status === 'ABSENT'
                                            ? 'bg-rose-100 text-rose-700'
                                            : 'bg-amber-100 text-amber-700'
                                }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                  student.status === 'PRESENT' ? 'bg-emerald-500'
                                      : student.status === 'ABSENT' ? 'bg-rose-500'
                                          : 'bg-amber-500'
                              }`}/>
                                {student.status}
                            </span>
                                                <div
                                                    className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200">
                                                    <CheckCircle className="h-4 w-4 text-white"/>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => updateStatus(student.studentId, 'PRESENT')}
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                                                        student.status === 'PRESENT'
                                                            ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                                            : 'bg-background border border-border hover:border-emerald-300 hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600'
                                                    }`}
                                                >
                                                    <CheckCircle className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateStatus(student.studentId, 'ABSENT')}
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                                                        student.status === 'ABSENT'
                                                            ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                                                            : 'bg-background border border-border hover:border-rose-300 hover:bg-rose-50 text-muted-foreground hover:text-rose-600'
                                                    }`}
                                                >
                                                    <XCircle className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => updateStatus(student.studentId, 'LEAVE')}
                                                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                                                        student.status === 'LEAVE'
                                                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                                                            : 'bg-background border border-border hover:border-amber-300 hover:bg-amber-50 text-muted-foreground hover:text-amber-600'
                                                    }`}
                                                >
                                                    <Palmtree className="h-4 w-4"/>
                                                </button>
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
