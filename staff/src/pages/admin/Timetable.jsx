import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {subjectsAPI, timetableAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {BookOpen, Calendar, Clock, Pencil, Plus, Trash2, User} from 'lucide-react'
import {useClasses} from '@/hooks/useClasses'
import {useTeachers} from '@/hooks/useTeachers'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
const DAY_LABELS = {
    MONDAY: 'Mon',
    TUESDAY: 'Tue',
    WEDNESDAY: 'Wed',
    THURSDAY: 'Thu',
    FRIDAY: 'Fri',
    SATURDAY: 'Sat',
    SUNDAY: 'Sun',
}

const getCurrentDay = () => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
    return days[new Date().getDay()]
}

const initialFormData = {
    subjectId: '',
    teacherId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    room: '',
}

// ── Class Timetable Tab ────────────────────────────────────────────────────────

function ClassTimetableTab() {
    const {classes} = useClasses()
    const {teachers} = useTeachers()
    const [timetable, setTimetable] = useState({})
    const [subjects, setSubjects] = useState([])
    const [selectedClassId, setSelectedClassId] = useState('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const [formData, setFormData] = useState(initialFormData)
    const {toast} = useToast()

    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            setSelectedClassId(classes[0].id)
        }
    }, [classes])

    useEffect(() => {
        if (selectedClassId) {
            fetchTimetable()
            fetchSubjects()
        }
    }, [selectedClassId])

    const fetchSubjects = async () => {
        try {
            const response = await subjectsAPI.getAll({classId: selectedClassId})
            setSubjects(response.data.subjects)
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    const fetchTimetable = async () => {
        setLoading(true)
        try {
            const response = await timetableAPI.getByClass(selectedClassId)
            setTimetable(response.data.timetable)
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch timetable'})
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (entry = null, day = null) => {
        if (entry) {
            setEditingEntry(entry)
            setFormData({
                subjectId: entry.subjectId,
                teacherId: entry.teacherId || '',
                dayOfWeek: entry.dayOfWeek,
                startTime: entry.startTime,
                endTime: entry.endTime,
                room: entry.room || '',
            })
        } else {
            setEditingEntry(null)
            setFormData({...initialFormData, dayOfWeek: day || ''})
        }
        setDialogOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const data = {
                ...formData,
                classId: selectedClassId,
                teacherId: formData.teacherId && formData.teacherId !== 'none' ? formData.teacherId : null,
            }
            if (editingEntry) {
                await timetableAPI.update(editingEntry.id, data)
                toast({title: 'Success', description: 'Timetable entry updated successfully'})
            } else {
                await timetableAPI.create(data)
                toast({title: 'Success', description: 'Timetable entry created successfully'})
            }
            setDialogOpen(false)
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Operation failed'})
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return
        try {
            await timetableAPI.delete(id)
            toast({title: 'Success', description: 'Entry deleted successfully'})
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: error.response?.data?.message || 'Failed to delete entry'})
        }
    }

    const handleClearTimetable = async () => {
        if (!window.confirm('Are you sure you want to clear the entire timetable for this class?')) return
        try {
            await timetableAPI.clearClass(selectedClassId)
            toast({title: 'Success', description: 'Timetable cleared successfully'})
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to clear timetable'})
        }
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)
    const currentDay = getCurrentDay()

    return (
        <>
            <PagePanel
                icon={Calendar}
                title={"Class Timetable"}
                countLabel={selectedClass?.name}
                addLabel={'Add Lecture'}
                onAdd={() => handleOpenDialog()}
            >
                <div className="flex flex-wrap items-center justify-between mb-6 gap-3">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-full xs:w-35">
                            <SelectValue placeholder="Select class"/>
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button className={'w-full xs:w-35'} variant="destructive" onClick={handleClearTimetable}>
                        Clear All
                    </Button>
                </div>
                {!selectedClassId ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="rounded-full bg-muted p-3">
                            <Calendar className="h-5 w-5 text-muted-foreground"/>
                        </div>
                        <p className="text-sm text-muted-foreground">Please select a class to view/edit timetable</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                        <p className="text-sm text-muted-foreground">Loading timetable...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                            {DAYS.map((day) => {
                                const entries = (timetable[day] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
                                return (
                                    <div key={day} className="space-y-2 rounded-xl p-1.5 transition-colors">
                                        <div className="p-2.5 rounded-lg text-center font-semibold text-sm tracking-tight bg-muted/60 text-foreground">
                                            {DAY_LABELS[day]}
                                        </div>
                                        <div className="space-y-1.5 min-h-[300px]">
                                            {entries.map((entry) => (
                                                <div key={entry.id} className="card p-2.5 text-sm group relative transition-all hover:bg-primary/[0.07] hover:shadow-sm">
                                                    <div className="font-medium text-foreground leading-snug pr-8">{entry.subject?.name}</div>
                                                    <div className="text-xs text-primary flex items-center gap-1 mt-1">
                                                        <Clock className="h-3 w-3 shrink-0"/>
                                                        {entry.startTime} – {entry.endTime}
                                                    </div>
                                                    {entry.teacher && (
                                                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{entry.teacher.name}</div>
                                                    )}
                                                    {entry.room && (
                                                        <div className="text-xs text-muted-foreground">Room {entry.room}</div>
                                                    )}
                                                    <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10" onClick={() => handleOpenDialog(entry)}>
                                                            <Pencil className="h-3 w-3"/>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10" onClick={() => handleDelete(entry.id)}>
                                                            <Trash2 className="h-3 w-3 text-destructive"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full border border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                                                onClick={() => handleOpenDialog(null, day)}
                                            >
                                                <Plus className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </PagePanel>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {editingEntry ? 'Edit Period' : 'Add Period'} - {selectedClass?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Day *</Label>
                            <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({...formData, dayOfWeek: v})}>
                                <SelectTrigger><SelectValue placeholder="Select day"/></SelectTrigger>
                                <SelectContent>
                                    {DAYS.map((day) => (
                                        <SelectItem key={day} value={day}>{DAY_LABELS[day]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject *</Label>
                            <Select value={formData.subjectId} onValueChange={(v) => setFormData({...formData, subjectId: v})}>
                                <SelectTrigger><SelectValue placeholder="Select subject"/></SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Teacher</Label>
                            <Select value={formData.teacherId} onValueChange={(v) => setFormData({...formData, teacherId: v})}>
                                <SelectTrigger><SelectValue placeholder="Select teacher (optional)"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No teacher assigned</SelectItem>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Time *</Label>
                                <Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required/>
                            </div>
                            <div className="space-y-2">
                                <Label>End Time *</Label>
                                <Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Room</Label>
                            <Input value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} placeholder="e.g., Room 101"/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">{editingEntry ? 'Update' : 'Add'} Period</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ── Teacher Timetable Tab ──────────────────────────────────────────────────────

function TeacherTimetableTab() {
    const {teachers} = useTeachers()
    const [timetable, setTimetable] = useState({})
    const [selectedTeacherId, setSelectedTeacherId] = useState('')
    const [loading, setLoading] = useState(false)
    const {toast} = useToast()

    useEffect(() => {
        if (teachers.length > 0 && !selectedTeacherId) {
            setSelectedTeacherId(teachers[0].id)
        }
    }, [teachers])

    useEffect(() => {
        if (selectedTeacherId) {
            fetchTimetable()
        }
    }, [selectedTeacherId])

    const fetchTimetable = async () => {
        setLoading(true)
        try {
            const response = await timetableAPI.getByTeacher(selectedTeacherId)
            setTimetable(response.data.timetable)
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch timetable'})
        } finally {
            setLoading(false)
        }
    }

    const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)

    return (
        <PagePanel
            icon={User}
            title={"Teacher Timetable"}
            countLabel={selectedTeacher?.name}
        >
            <div className="mb-6">
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger className="w-full xs:w-48">
                        <SelectValue placeholder="Select teacher"/>
                    </SelectTrigger>
                    <SelectContent>
                        {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {!selectedTeacherId ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="rounded-full bg-muted p-3">
                        <User className="h-5 w-5 text-muted-foreground"/>
                    </div>
                    <p className="text-sm text-muted-foreground">Please select a teacher to view their timetable</p>
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
                    <p className="text-sm text-muted-foreground">Loading timetable...</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-6 gap-2 min-w-[800px]">
                        {DAYS.map((day) => {
                            const entries = (timetable[day] || []).sort((a, b) => a.startTime.localeCompare(b.startTime))
                            return (
                                <div key={day} className="space-y-2 rounded-xl p-1.5">
                                    <div className="p-2.5 rounded-lg text-center font-semibold text-sm tracking-tight bg-muted/60 text-foreground">
                                        {DAY_LABELS[day]}
                                    </div>
                                    <div className="space-y-1.5 min-h-[300px]">
                                        {entries.length === 0 ? (
                                            <div className="flex items-center justify-center h-16">
                                                <span className="text-xs text-muted-foreground/40">—</span>
                                            </div>
                                        ) : entries.map((entry) => (
                                            <div key={entry.id} className="card p-2.5 text-sm">
                                                <div className="font-medium text-foreground leading-snug">{entry.subject?.name}</div>
                                                <div className="text-xs text-primary flex items-center gap-1 mt-1">
                                                    <Clock className="h-3 w-3 shrink-0"/>
                                                    {entry.startTime} – {entry.endTime}
                                                </div>
                                                {entry.class && (
                                                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                        <BookOpen className="h-3 w-3 shrink-0"/>
                                                        {entry.class.name}
                                                    </div>
                                                )}
                                                {entry.room && (
                                                    <div className="text-xs text-muted-foreground">Room {entry.room}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </PagePanel>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTimetable() {
    const [activeTab, setActiveTab] = useState('class')

    return (
        <DashboardLayout title="Timetable Management">
            <div className="space-y-6">
                {/* Tab switcher */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('class')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'class'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Calendar className="h-4 w-4"/>
                        Class Timetable
                    </button>
                    <button
                        onClick={() => setActiveTab('teacher')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'teacher'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <User className="h-4 w-4"/>
                        Teacher Timetable
                    </button>
                </div>

                {activeTab === 'class' ? <ClassTimetableTab/> : <TeacherTimetableTab/>}
            </div>
        </DashboardLayout>
    )
}
