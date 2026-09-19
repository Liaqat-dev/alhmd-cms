import {useEffect, useState} from 'react'
import {timetableAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {BookOpen, Calendar, Clock, MapPin, User} from 'lucide-react'

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_SHORT = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
    THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat',
}
const DAY_FULL = {
    MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
    THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday',
}

const getCurrentDay = () => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[new Date().getDay()]
}

const formatTime = (time) => {
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

const getDuration = (start, end) => {
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
}

export default function TimetableView({title = 'My Timetable', classId = null}) {
    const currentDay = getCurrentDay()
    const [timetable, setTimetable] = useState({})
    const [loading, setLoading] = useState(true)
    const [activeDay, setActiveDay] = useState(currentDay)
    const {toast} = useToast()


    useEffect(() => {
        fetchTimetable()
    }, [classId])

    useEffect(() => {
        if (!loading) {
            const hasToday = timetable[currentDay]?.length > 0
            if (hasToday) {
                setActiveDay(currentDay)
            } else {
                const first = DAYS.find(d => timetable[d]?.length > 0)
                setActiveDay(first || DAYS[0])
            }
        }
    }, [loading])

    const fetchTimetable = async () => {
        try {
            const response = await timetableAPI.getMyTimetable()
            let timetableData = response.data.timetable
            console.log('Raw timetable response:', timetableData)
            console.log('Filtering with classId:', classId)

            // Filter by class if classId is provided
            if (classId) {
                const filtered = {}
                DAYS.forEach(day => {
                    const dayEntries = (timetableData[day] || [])
                    const filteredEntries = dayEntries.filter(entry => entry.classId === classId)
                    console.log(`${day}: ${dayEntries.length} total, ${filteredEntries.length} after filter`)
                    filtered[day] = filteredEntries
                })
                timetableData = filtered
                console.log('Filtered timetable:', timetableData)
            }

            setTimetable(timetableData)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch timetable'})
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center h-64 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                <p className="text-sm text-muted-foreground">Loading timetable...</p>
            </div>
        )
    }

    const hasEntries = DAYS.some(d => timetable[d]?.length > 0)
    const activeEntries = (timetable[activeDay] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className=" card bg-gradient-to-r from-primary/[0.04] to-transparent  p-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                        <h2 className="text-sm sm:text-lg font-semibold tracking-tight">{title}</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {DAY_FULL[currentDay]?.slice(0, 3) ?? 'Weekend'} — {new Date().toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                        </p>
                    </div>
                </div>
            </div>

            {!hasEntries ? (
                <div
                    className="rounded-xl border bg-card shadow-sm flex flex-col items-center justify-center py-16 gap-3">
                    <div className="rounded-full bg-muted p-4">
                        <Calendar className="h-6 w-6 text-muted-foreground"/>
                    </div>
                    <p className="text-sm font-medium">No timetable assigned</p>
                    <p className="text-xs text-center text-muted-foreground">Your schedule will appear here once it's
                        configured.</p>
                </div>
            ) : (
                <div className="card shadow-sm overflow-hidden">
                    {/* Day selector tabs */}
                    <div className="grid grid-cols-6 border-b">
                        {DAYS.map((day) => {
                            const count = timetable[day]?.length || 0
                            const isToday = day === currentDay
                            const isActive = day === activeDay
                            return (
                                <button
                                    key={day}
                                    onClick={() => setActiveDay(day)}
                                    className={`relative flex flex-col items-center gap-0.5 py-3 px-1 text-center transition-colors
                    ${isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    {isActive && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"/>
                                    )}
                                    <span className="text-[11px] font-semibold uppercase tracking-widest">
                    {DAY_SHORT[day]}
                  </span>
                                    {isToday ? (
                                        <span className={`h-2 w-2  font-bold uppercase   rounded-full
                      ${isActive ? 'bg-primary text-primary-foreground' : 'bg-accent/20 text-accent'}`}/>
                                    ) : (
                                        <span className="h-2"/>
                                    )}
                                    <span
                                        className={`text-[10px] ${isActive ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
                    {count > 0 ? `${count} LEC` : '—'}
                  </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Lecture list */}
                    <div className="p-5">
                        {activeEntries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <div className="rounded-full bg-muted p-3">
                                    <BookOpen className="h-5 w-5 text-muted-foreground"/>
                                </div>
                                <p className="text-sm text-muted-foreground">No classes on {DAY_FULL[activeDay]}</p>
                            </div>
                        ) : (
                            <div className="space-y-0">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pb-4">
                                    {DAY_FULL[activeDay]} · {activeEntries.length} {activeEntries.length === 1 ? 'lecture' : 'lectures'}
                                </p>
                                {activeEntries.map((entry, idx) => {
                                    const duration = getDuration(entry.startTime, entry.endTime)
                                    const isCurrentDay = activeDay === currentDay
                                    return (
                                        <div key={entry.id} className="flex gap-3">
                                            {/* Timeline spine */}
                                            <div className="flex flex-col items-center pt-[18px]">
                                                <div className={`h-2 w-2 rounded-full shrink-0 ring-2
                          ${isCurrentDay
                                                    ? 'bg-primary ring-primary/20'
                                                    : 'bg-muted-foreground/20 ring-muted-foreground/10'
                                                }`}
                                                />
                                                {idx < activeEntries.length - 1 && (
                                                    <div className="w-px flex-1 bg-border mt-1.5 min-h-6"/>
                                                )}
                                            </div>

                                            {/* Lecture card */}
                                            <div className={`flex-1 rounded-xl border p-4 mb-2.5 transition-colors cursor-default
                        ${isCurrentDay
                                                ? 'border-primary/15 bg-primary/[0.025] hover:bg-primary/[0.05]'
                                                : 'border-border bg-muted/20 hover:bg-muted/35'
                                            }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div
                                                        className="flex flex-col flex-1 flex-wrap items-start gap-x-4 gap-y-1.5 mt-2">
                                                        <div className={'flex w-full flex-1 justify-between'}>
                                                            <h4 className="font-semibold text-sm leading-snug">{entry.subject?.name}</h4>
                                                            <div
                                                                className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg whitespace-nowrap${isCurrentDay
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-muted text-muted-foreground'
                                                                }`}
                                                            >
                                                                {formatTime(entry.startTime)}
                                                            </div>
                                                        </div>
                                                        <div className={`flex  flex-1 flex-wrap  gap-3`}>
                                                        <span
                                                            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                                <Clock className="h-3 w-3 shrink-0"/>
                                                            {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                                                            <span
                                                                className="hidden sm:inline text-muted-foreground/40">· {duration} min</span>
                              </span>
                                                        {entry.teacher && (
                                                            <span
                                                                className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                                  <User className="h-3 w-3 shrink-0"/>{entry.teacher.name}
                                </span>
                                                        )}

                                                            {entry.class && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                                  <BookOpen className="h-3 w-3 shrink-0"/>{entry.class.name}
                                </span>
                                                            )}
                                                            {entry.room && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0"/>{entry.room}
                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
