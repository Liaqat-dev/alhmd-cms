import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {subjectsAPI, timetableAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {BookOpen, Calendar, Clock, GraduationCap, Pencil, Plus, Trash2, User, Users} from 'lucide-react'
import {useClasses} from '@/hooks/useClasses'
import {useTeachers} from '@/hooks/useTeachers'
import {PagePanel} from "@/components/shared/admin-table.jsx";
import {cn} from '@/lib/utils'

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
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    room: '',
}

// Select values are strings; ids off the API are numbers.
const sameId = (a, b) => a != null && b != null && String(a) === String(b)

// The API answers with { errors: { ... } }, so a clash message ("Teacher is
// already scheduled in ...") only reaches the toast if we read that envelope.
const apiError = (error, fallback) => {
    const errors = error.response?.data?.errors
    if (!errors) return fallback
    return errors.message || Object.values(errors)[0] || fallback
}

// ── Lecture dialog ────────────────────────────────────────────────────────────
// Shared by both tabs. A lecture always belongs to a class, and who teaches it
// follows from the subject — so the teacher is never typed in here, it is
// derived:
//
//   Class tab    pick a subject, and its teacher fills in, read-only.
//   Teacher tab  the teacher is already chosen, so only the subjects they
//                teach in the picked class are offered.
//
// A subject is meant to have one teacher. Rows created before that rule was
// enforced can still name several, and the field says so rather than picking
// one at random.

function LectureDialog({
                           open,
                           onOpenChange,
                           editingEntry,
                           fixedClassId,
                           fixedTeacherId,
                           classes,
                           teachers,
                           onSaved,
                           initialForm = initialFormData,
                       }) {
    // Seeded once per open: the caller changes `key` when the dialog opens, so
    // each open remounts with a fresh form rather than leaking the last one.
    const [formData, setFormData] = useState(initialForm)
    const [subjects, setSubjects] = useState([])
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [saving, setSaving] = useState(false)
    const {toast} = useToast()

    const classId = fixedClassId ?? formData.classId
    // A lecture cannot be moved between classes after the fact — the update
    // endpoint does not accept a classId, so the picker locks while editing.
    const classLocked = Boolean(fixedClassId) || Boolean(editingEntry)

    // Subjects belong to a class, so the list follows whichever class is
    // chosen. Each one carries its teachers, which is what the teacher field
    // below is derived from.
    useEffect(() => {
        if (!open || !classId) {
            setSubjects([])
            return
        }
        let cancelled = false
        setLoadingSubjects(true)
        subjectsAPI.getAll({classId})
            .then(res => { if (!cancelled) setSubjects(res.data.subjects || []) })
            .catch(() => { if (!cancelled) setSubjects([]) })
            .finally(() => { if (!cancelled) setLoadingSubjects(false) })
        return () => { cancelled = true }
    }, [open, classId])

    // On the teacher tab only this teacher's subjects can be scheduled.
    const offeredSubjects = fixedTeacherId
        ? subjects.filter(sub => (sub.teachers || []).some(t => sameId(t.id, fixedTeacherId)))
        : subjects

    const chosenSubject = subjects.find(sub => sameId(sub.id, formData.subjectId))
    const subjectTeachers = chosenSubject?.teachers || []

    // Who ends up on the lecture. The teacher tab pins its own teacher; other-
    // wise it is the subject's, when the subject has exactly one.
    const derivedTeacherId = fixedTeacherId
        ? fixedTeacherId
        : (subjectTeachers.length === 1 ? subjectTeachers[0].id : null)

    const teacherNote = () => {
        if (fixedTeacherId) return null
        if (!formData.subjectId) return 'Pick a subject and its teacher fills in here.'
        if (subjectTeachers.length === 0) return 'No teacher is assigned to this subject yet — set one on the Subjects page.'
        if (subjectTeachers.length > 1) {
            return `${subjectTeachers.map(t => t.name).join(', ')} are all assigned to this subject. Give it a single teacher on the Subjects page.`
        }
        return null
    }

    const teacherValue = fixedTeacherId
        ? (teachers || []).find(t => sameId(t.id, fixedTeacherId))?.name || ''
        : subjectTeachers.length === 1
            ? subjectTeachers[0].name
            : subjectTeachers.length > 1
                ? subjectTeachers.map(t => t.name).join(', ')
                : ''

    const handleClassChange = (value) => {
        // The chosen subject belongs to the old class, so it cannot survive.
        setFormData(f => ({...f, classId: value, subjectId: ''}))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!classId) {
            toast({variant: 'destructive', title: 'Pick a class', description: 'A lecture has to belong to a class.'})
            return
        }
        if (!formData.subjectId) {
            toast({variant: 'destructive', title: 'Pick a subject', description: 'Choose which subject is taught.'})
            return
        }

        setSaving(true)
        try {
            const teacherId = derivedTeacherId ?? null
            const data = {
                subjectId: formData.subjectId,
                teacherId,
                dayOfWeek: formData.dayOfWeek,
                startTime: formData.startTime,
                endTime: formData.endTime,
                room: formData.room,
            }

            if (editingEntry) {
                await timetableAPI.update(editingEntry.id, data)
                toast({title: 'Success', description: 'Timetable entry updated successfully'})
            } else {
                await timetableAPI.create({...data, classId})
                toast({title: 'Success', description: 'Timetable entry created successfully'})
            }
            onOpenChange(false)
            onSaved()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: apiError(error, 'Failed to save timetable entry'),
            })
        } finally {
            setSaving(false)
        }
    }

    const selectedClass = classes?.find(c => sameId(c.id, classId))
    const fixedTeacherName = fixedTeacherId
        ? (teachers || []).find(t => sameId(t.id, fixedTeacherId))?.name
        : null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        {editingEntry ? 'Edit Lecture' : 'Add Lecture'}
                        {selectedClass ? ` - ${selectedClass.name}` : ''}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!fixedClassId && (
                        <div className="space-y-2">
                            <Label>Class *</Label>
                            <Select
                                value={formData.classId ? String(formData.classId) : ''}
                                onValueChange={handleClassChange}
                                disabled={classLocked}
                            >
                                <SelectTrigger><SelectValue placeholder="Select class"/></SelectTrigger>
                                <SelectContent>
                                    {(classes || []).map((cls) => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {classLocked && editingEntry && (
                                <p className="text-xs text-muted-foreground">
                                    A lecture stays with its class. Delete it and add it again to move it.
                                </p>
                            )}
                        </div>
                    )}

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
                        <Select
                            value={formData.subjectId ? String(formData.subjectId) : ''}
                            onValueChange={(v) => setFormData({...formData, subjectId: v})}
                            disabled={!classId || offeredSubjects.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={classId ? 'Select subject' : 'Pick a class first'}/>
                            </SelectTrigger>
                            <SelectContent>
                                {offeredSubjects.map((subject) => (
                                    <SelectItem key={subject.id} value={String(subject.id)}>{subject.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {classId && !loadingSubjects && offeredSubjects.length === 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                {subjects.length === 0
                                    ? 'This class has no subjects yet. Add them on the Subjects page.'
                                    : `${fixedTeacherName || 'This teacher'} is not teaching any subject in ${selectedClass?.name || 'this class'}. Assign one on the Subjects page or on their profile.`}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Teacher</Label>
                        {/* Never typed in: it comes from the subject, or from the
                            teacher whose timetable this is. */}
                        <Input value={teacherValue} placeholder="—" readOnly disabled/>
                        {teacherNote() && (
                            <p className={cn(
                                'text-xs',
                                subjectTeachers.length > 1 || (formData.subjectId && subjectTeachers.length === 0)
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-muted-foreground'
                            )}>
                                {teacherNote()}
                            </p>
                        )}
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
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>{editingEntry ? 'Update' : 'Add'} Lecture</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Seeds the dialog's form from an entry being edited, or from a blank slot.
const formFor = (entry, day, {classId, teacherId}) => entry
    ? {
        classId: entry.classId || classId || '',
        subjectId: entry.subjectId || '',
        teacherId: entry.teacherId || 'none',
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room || '',
    }
    : {
        ...initialFormData,
        classId: classId || '',
        teacherId: teacherId || '',
        dayOfWeek: day || getCurrentDay(),
    }

// A single lecture card, with its edit/delete affordances on hover.
function EntryCard({entry, secondary, onEdit, onDelete}) {
    return (
        <div className="card p-2.5 text-sm group relative transition-all hover:bg-primary/[0.07] hover:shadow-sm">
            <div className="font-medium text-foreground leading-snug pr-8">{entry.subject?.name}</div>
            <div className="text-xs text-primary flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3 shrink-0"/>
                {entry.startTime} – {entry.endTime}
            </div>
            {secondary}
            {entry.room && (
                <div className="text-xs text-muted-foreground">Room {entry.room}</div>
            )}
            <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-primary/10" onClick={() => onEdit(entry)}>
                    <Pencil className="h-3 w-3"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10" onClick={() => onDelete(entry.id)}>
                    <Trash2 className="h-3 w-3 text-destructive"/>
                </Button>
            </div>
        </div>
    )
}

// The Mon–Sat grid, shared by both tabs.
function WeekGrid({timetable, renderSecondary, onEdit, onDelete, onAdd}) {
    return (
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
                                    <EntryCard
                                        key={entry.id}
                                        entry={entry}
                                        secondary={renderSecondary(entry)}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full border border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                                    onClick={() => onAdd(day)}
                                >
                                    <Plus className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function Placeholder({icon: Icon, message, spinner}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            {spinner ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"/>
            ) : (
                <div className="rounded-full bg-muted p-3">
                    <Icon className="h-5 w-5 text-muted-foreground"/>
                </div>
            )}
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}

// ── Class Timetable Tab ────────────────────────────────────────────────────────

function ClassTimetableTab() {
    const {classes} = useClasses()
    const {teachers} = useTeachers()
    const [timetable, setTimetable] = useState({})
    const [selectedClassId, setSelectedClassId] = useState('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const [seed, setSeed] = useState(initialFormData)
    const {toast} = useToast()

    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) setSelectedClassId(classes[0].id)
    }, [classes])

    useEffect(() => {
        if (selectedClassId) fetchTimetable()
    }, [selectedClassId])

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

    const openDialog = (entry = null, day = null) => {
        setEditingEntry(entry)
        setSeed(formFor(entry, day, {classId: selectedClassId}))
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this timetable entry?')) return
        try {
            await timetableAPI.delete(id)
            toast({title: 'Success', description: 'Timetable entry deleted successfully'})
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: apiError(error, 'Failed to delete entry')})
        }
    }

    const handleClearTimetable = async () => {
        if (!window.confirm('Are you sure you want to clear the entire timetable for this class?')) return
        try {
            await timetableAPI.clearClass(selectedClassId)
            toast({title: 'Success', description: 'Timetable cleared successfully'})
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: apiError(error, 'Failed to clear timetable')})
        }
    }

    const selectedClass = classes.find(c => sameId(c.id, selectedClassId))

    return (
        <>
            <PagePanel
                icon={Calendar}
                title={"Class Timetable"}
                countLabel={selectedClass?.name}
                addLabel={'Add Lecture'}
                onAdd={() => openDialog()}
            >
                <div className="flex items-center justify-between mb-6 gap-3">
                    <Select value={selectedClassId ? String(selectedClassId) : ''} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-full xs:w-35">
                            <SelectValue placeholder="Select class"/>
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button className={'w-full xs:w-35'} variant="destructive" onClick={handleClearTimetable}>
                        Clear All
                    </Button>
                </div>

                {!selectedClassId ? (
                    <Placeholder icon={Calendar} message="Please select a class to view/edit timetable"/>
                ) : loading ? (
                    <Placeholder spinner message="Loading timetable..."/>
                ) : (
                    <WeekGrid
                        timetable={timetable}
                        renderSecondary={(entry) => entry.teacher && (
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{entry.teacher.name}</div>
                        )}
                        onEdit={(entry) => openDialog(entry)}
                        onDelete={handleDelete}
                        onAdd={(day) => openDialog(null, day)}
                    />
                )}
            </PagePanel>

            <LectureDialog
                key={dialogOpen ? `${editingEntry?.id ?? 'new'}-${seed.dayOfWeek}` : 'closed'}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editingEntry={editingEntry}
                fixedClassId={selectedClassId}
                classes={classes}
                teachers={teachers}
                onSaved={fetchTimetable}
                initialForm={seed}
            />
        </>
    )
}

// ── Teacher Timetable Tab ──────────────────────────────────────────────────────

function TeacherTimetableTab() {
    const {classes} = useClasses()
    const {teachers} = useTeachers()
    const [timetable, setTimetable] = useState({})
    const [selectedTeacherId, setSelectedTeacherId] = useState('')
    const [loading, setLoading] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEntry, setEditingEntry] = useState(null)
    const [seed, setSeed] = useState(initialFormData)
    const {toast} = useToast()

    useEffect(() => {
        if (teachers.length > 0 && !selectedTeacherId) setSelectedTeacherId(teachers[0].id)
    }, [teachers])

    useEffect(() => {
        if (selectedTeacherId) fetchTimetable()
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

    const openDialog = (entry = null, day = null) => {
        setEditingEntry(entry)
        setSeed(formFor(entry, day, {teacherId: selectedTeacherId}))
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this timetable entry?')) return
        try {
            await timetableAPI.delete(id)
            toast({title: 'Success', description: 'Timetable entry deleted successfully'})
            fetchTimetable()
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: apiError(error, 'Failed to delete entry')})
        }
    }

    const selectedTeacher = teachers.find(t => sameId(t.id, selectedTeacherId))

    return (
        <>
            <PagePanel
                icon={User}
                title={"Teacher Timetable"}
                countLabel={selectedTeacher?.name}
                addLabel={'Add Lecture'}
                onAdd={() => openDialog()}
            >
                <div className="mb-6">
                    <Select value={selectedTeacherId ? String(selectedTeacherId) : ''} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger className="w-full xs:w-48">
                            <SelectValue placeholder="Select teacher"/>
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {!selectedTeacherId ? (
                    <Placeholder icon={User} message="Please select a teacher to view their timetable"/>
                ) : loading ? (
                    <Placeholder spinner message="Loading timetable..."/>
                ) : (
                    <WeekGrid
                        timetable={timetable}
                        renderSecondary={(entry) => entry.class && (
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <BookOpen className="h-3 w-3 shrink-0"/>
                                {entry.class.name}
                            </div>
                        )}
                        onEdit={(entry) => openDialog(entry)}
                        onDelete={handleDelete}
                        onAdd={(day) => openDialog(null, day)}
                    />
                )}
            </PagePanel>

            <LectureDialog
                key={dialogOpen ? `${editingEntry?.id ?? 'new'}-${seed.dayOfWeek}` : 'closed'}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                editingEntry={editingEntry}
                fixedTeacherId={selectedTeacherId}
                classes={classes}
                teachers={teachers}
                onSaved={fetchTimetable}
                initialForm={seed}
            />
        </>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminTimetable() {
    return (
        <DashboardLayout title="Timetable Management">
            <Tabs defaultValue="class" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="class" className="gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5"/> Class Timetable
                    </TabsTrigger>
                    <TabsTrigger value="teacher" className="gap-1.5">
                        <Users className="h-3.5 w-3.5"/> Teacher Timetable
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="class">
                    <ClassTimetableTab/>
                </TabsContent>
                <TabsContent value="teacher">
                    <TeacherTimetableTab/>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    )
}
