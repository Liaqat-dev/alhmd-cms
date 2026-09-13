import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent} from '@/components/ui/card'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {marksAPI, subjectsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {useClasses} from '@/hooks/useClasses'
import {
    Award,
    Calendar,
    ClipboardCheck,
    FileText,
    Filter,
    GraduationCap,
    Pencil,
    Plus,
    Trash2,
    Users,
} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const EXAM_TYPES = [
    {value: 'MONTHLY_TEST', label: 'Monthly Test'},
    {value: 'MIDTERM', label: 'Midterm'},
    {value: 'FINAL', label: 'Final'},
    {value: 'QUIZ', label: 'Quiz'},
    {value: 'ASSIGNMENT', label: 'Assignment'},
    {value: 'TASK', label: 'Task'},
]

export default function AdminMarks() {
    const {classes} = useClasses()
    const [exams, setExams] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [marksDialogOpen, setMarksDialogOpen] = useState(false)
    const [editingExam, setEditingExam] = useState(null)
    const [selectedExam, setSelectedExam] = useState(null)
    const [classMarksData, setClassMarksData] = useState(null)
    const [marksEntries, setMarksEntries] = useState([])
    const [filters, setFilters] = useState({classId: '', examType: '', subjectId: ''})
    const [filterSubjects, setFilterSubjects] = useState([])
    const {toast} = useToast()

    const examForm = useAppForm({
        initialValues: {
            name: '',
            examType: 'MONTHLY_TEST',
            classId: '',
            subjectId: '',
            totalMarks: 100,
            passingMarks: 40,
            examDate: '',
        },
        onSubmit: async (values) => {
            if (editingExam) {
                await marksAPI.updateExam(editingExam.id, values)
                return 'Exam updated successfully'
            } else {
                const res = await marksAPI.createExam(values)
                return res.data.message || 'Exam created successfully'
            }
        },
        onSuccess: (message) => {
            toast({title: 'Success', description: message})
            setDialogOpen(false)
            fetchData()
        },
    })

    useEffect(() => {
        fetchData()
    }, [filters])

    useEffect(() => {
        if (filters.classId) {
            fetchFilterSubjects(filters.classId)
        } else {
            setFilterSubjects([])
            if (filters.subjectId) {
                setFilters(prev => ({...prev, subjectId: ''}))
            }
        }
    }, [filters.classId])

    useEffect(() => {
        if (examForm.formik.values.classId) {
            fetchSubjects(examForm.formik.values.classId)
            if (!editingExam) {
                examForm.formik.setFieldValue('subjectId', '')
            }
        } else {
            setSubjects([])
            if (!editingExam) examForm.formik.setFieldValue('subjectId', '')
        }
    }, [examForm.formik.values.classId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const examsRes = await marksAPI.getExams(filters)
            setExams(examsRes.data.exams)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch data',
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchSubjects = async (classId) => {
        try {
            const res = await subjectsAPI.getAll({classId})
            setSubjects(res.data.subjects || res.data)
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    const fetchFilterSubjects = async (classId) => {
        try {
            const res = await subjectsAPI.getAll({classId})
            setFilterSubjects(res.data.subjects || res.data)
        } catch (error) {
            console.error('Failed to fetch filter subjects:', error)
        }
    }

    const handleOpenDialog = (exam = null) => {
        if (exam) {
            setEditingExam(exam)
            examForm.formik.resetForm({
                values: {
                    name: exam.name || exam.title || '',
                    examType: exam.examType,
                    classId: exam.classId,
                    subjectId: exam.subjectId,
                    totalMarks: exam.totalMarks,
                    passingMarks: exam.passingMarks,
                    examDate: (exam.examDate || exam.scheduledDate)?.split('T')[0] || '',
                },
            })
            fetchSubjects(exam.classId)
        } else {
            setEditingExam(null)
            examForm.formik.resetForm()
            setSubjects([])
        }
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this exam? All marks will be deleted.')) return
        try {
            await marksAPI.deleteExam(id)
            toast({title: 'Success', description: 'Exam deleted successfully'})
            fetchData()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete exam',
            })
        }
    }

    const openMarksDialog = async (exam) => {
        try {
            const res = await marksAPI.getClassMarks(exam.id)
            setSelectedExam(res.data.exam)
            setClassMarksData(res.data)
            const entries = res.data.students.map(student => ({
                studentId: student.id,
                studentName: student.name,
                rollNumber: student.rollNumber,
                obtainedMarks: student.marks[0]?.obtainedMarks || '',
                remarks: student.marks[0]?.remarks || '',
            }))
            setMarksEntries(entries)
            setMarksDialogOpen(true)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch class marks',
            })
        }
    }

    const handleMarksChange = (studentId, field, value) => {
        setMarksEntries(prev => prev.map(entry =>
            entry.studentId === studentId ? {...entry, [field]: value} : entry
        ))
    }

    const handleSaveMarks = async () => {
        try {
            const marks = marksEntries
                .filter(entry => entry.obtainedMarks !== '')
                .map(entry => ({
                    studentId: entry.studentId,
                    obtainedMarks: parseFloat(entry.obtainedMarks),
                    remarks: entry.remarks,
                }))

            if (marks.length === 0) {
                toast({variant: 'destructive', title: 'Error', description: 'No marks to save'})
                return
            }

            const res = await marksAPI.enterMarks({examId: selectedExam.id, marks})
            toast({
                title: 'Success',
                description: `${res.data.results.created} created, ${res.data.results.updated} updated`
            })
            setMarksDialogOpen(false)
            fetchData()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save marks',
            })
        }
    }

    const getExamTypeBadge = (type) => {
        const config = {
            MONTHLY_TEST: {bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500'},
            MIDTERM: {bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500'},
            FINAL: {bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500'},
            QUIZ: {bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
            ASSIGNMENT: {bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500'},
            TASK: {bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500'},
        }
        const style = config[type] || config.MONTHLY_TEST
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}/>
                {type.replace('_', ' ')}
      </span>
        )
    }

    const totalExams = exams.length
    const totalWithMarks = exams.filter(e => (e._count?.marks || 0) > 0).length
    const examTypes = [...new Set(exams.map(e => e.examType))]

    return (
        <DashboardLayout title="Marks Management">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-4 mb-6">
                <Card className="relative overflow-hidden">
                    <CardContent className="p-2 xs:p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                                <p className="text-3xl font-bold mt-1">{totalExams}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <FileText className="h-6 w-6 text-primary"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-2 xs:p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">With Marks</p>
                                <p className="text-3xl font-bold mt-1">{totalWithMarks}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <ClipboardCheck className="h-6 w-6 text-emerald-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-2 xs:p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending Entry</p>
                                <p className="text-3xl font-bold mt-1">{totalExams - totalWithMarks}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-amber-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 to-amber-500/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-2 xs:p-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Exam Types</p>
                                <p className="text-3xl font-bold mt-1">{examTypes.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-violet-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/80 to-violet-500/20"/>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table Card */}
            <PagePanel
                icon={GraduationCap}
                title="Exams & Marks"
                countLabel="Manage exams and mark students"
                addLabel="New Exam"
                onAdd={() => handleOpenDialog()}
            >
                <div
                    className="flex flex-wrap gap-3 mb-5 ">
                    <Select
                        value={filters.classId || "all"}
                        onValueChange={(value) => setFilters({
                            ...filters,
                            classId: value === "all" ? "" : value,
                            subjectId: ''
                        })}
                    >
                        <SelectTrigger className="w-full  xs:w-35">
                            <SelectValue placeholder="All Classes"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.examType || "all"}
                        onValueChange={(value) => setFilters({...filters, examType: value === "all" ? "" : value})}
                    >
                        <SelectTrigger className="w-full  xs:w-35">
                            <SelectValue placeholder="All Types"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {EXAM_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={filters.subjectId || "all"}
                        onValueChange={(value) => setFilters({...filters, subjectId: value === "all" ? "" : value})}
                        disabled={!filters.classId}
                    >
                        <SelectTrigger className="w-full  xs:w-35">
                            <SelectValue placeholder={filters.classId ? "All Subjects" : "Select class first"}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {filterSubjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(filters.classId || filters.examType || filters.subjectId) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({classId: '', examType: '', subjectId: ''})}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                                <div className="h-4 w-32 bg-muted rounded"/>
                                <div className="h-5 w-20 bg-muted rounded-full"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
                                <div className="h-4 w-16 bg-muted rounded"/>
                                <div className="h-4 w-16 bg-muted rounded"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
                                <div className="ml-auto h-8 w-28 bg-muted rounded"/>
                            </div>
                        ))}
                    </div>
                ) : exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                            <GraduationCap className="h-8 w-8 text-muted-foreground/60"/>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No exams found</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            {filters.classId || filters.examType || filters.subjectId
                                ? 'Try adjusting your filters to see more results.'
                                : 'Get started by creating your first exam.'}
                        </p>
                        {!filters.classId && !filters.examType && !filters.subjectId && (
                            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
                                <Plus className="h-4 w-4"/>
                                Create Exam
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-semibold">Exam Name</TableHead>
                                <TableHead className="font-semibold">Type</TableHead>
                                <TableHead className="font-semibold">Class</TableHead>
                                <TableHead className="font-semibold">Subject</TableHead>
                                <TableHead className="font-semibold text-center">Total</TableHead>
                                <TableHead className="font-semibold text-center">Pass</TableHead>
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold text-center">Entered</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.map((exam, index) => (
                                <TableRow key={exam.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                    <TableCell className="font-medium">{exam.name}</TableCell>
                                    <TableCell>{getExamTypeBadge(exam.examType)}</TableCell>
                                    <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Users className="h-3.5 w-3.5 text-muted-foreground"/>
                            {exam.class?.name}
                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{exam.subject?.name}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{exam.totalMarks}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{exam.passingMarks}</TableCell>
                                    <TableCell
                                        className="text-sm">{exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            (exam._count?.marks || 0) > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-muted text-muted-foreground'
                        }`}>
                          {exam._count?.marks || 0}
                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openMarksDialog(exam)}
                                                className="gap-1.5 h-8 text-xs"
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5"/>
                                                Marks
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleOpenDialog(exam)}
                                            >
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(exam.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Exam Form Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-primary"/>
                            </div>
                            {editingExam ? 'Edit Exam' : 'Create New Exam'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={examForm.formik.handleSubmit} className="space-y-5 pt-2">
                        <ServerError message={examForm.serverError} onDismiss={examForm.clearServerError}/>

                        <FormField
                            label="Exam Name"
                            name="name"
                            icon={<FileText className="h-4 w-4"/>}
                            placeholder="e.g., First Monthly Test"
                            value={examForm.formik.values.name}
                            error={examForm.formik.touched.name && examForm.formik.errors.name}
                            onChange={examForm.formik.handleChange}
                            onBlur={examForm.formik.handleBlur}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Exam Type"
                                name="examType"
                                icon={<ClipboardCheck className="h-4 w-4"/>}
                                value={examForm.formik.values.examType}
                                error={examForm.formik.touched.examType && examForm.formik.errors.examType}
                                onChange={examForm.formik.handleChange}
                                onBlur={examForm.formik.handleBlur}
                                options={EXAM_TYPES.map(t => ({value: t.value, label: t.label}))}
                                required
                            />
                            <FormSelect
                                label="Class"
                                name="classId"
                                icon={<Users className="h-4 w-4"/>}
                                placeholder="Select class"
                                value={examForm.formik.values.classId}
                                error={examForm.formik.touched.classId && examForm.formik.errors.classId}
                                onChange={examForm.formik.handleChange}
                                onBlur={examForm.formik.handleBlur}
                                options={classes.map(cls => ({value: cls.id, label: cls.name}))}
                                disabled={!!editingExam}
                                required
                            />
                        </div>

                        <FormSelect
                            label="Subject"
                            name="subjectId"
                            icon={<GraduationCap className="h-4 w-4"/>}
                            placeholder={examForm.formik.values.classId ? 'Select subject' : 'Select a class first'}
                            value={examForm.formik.values.subjectId}
                            error={examForm.formik.touched.subjectId && examForm.formik.errors.subjectId}
                            onChange={examForm.formik.handleChange}
                            onBlur={examForm.formik.handleBlur}
                            options={[
                                ...(!editingExam ? [{value: 'ALL', label: 'All Subjects'}] : []),
                                ...subjects.map(s => ({value: s.id, label: s.name}))
                            ]}
                            disabled={!examForm.formik.values.classId || !!editingExam}
                            required
                        />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                label="Total Marks"
                                name="totalMarks"
                                type="number"
                                icon={<Award className="h-4 w-4"/>}
                                value={String(examForm.formik.values.totalMarks)}
                                error={examForm.formik.touched.totalMarks && examForm.formik.errors.totalMarks}
                                onChange={(e) => examForm.formik.setFieldValue('totalMarks', parseInt(e.target.value))}
                                onBlur={examForm.formik.handleBlur}
                                required
                            />
                            <FormField
                                label="Pass Marks"
                                name="passingMarks"
                                type="number"
                                icon={<Award className="h-4 w-4"/>}
                                value={String(examForm.formik.values.passingMarks)}
                                error={examForm.formik.touched.passingMarks && examForm.formik.errors.passingMarks}
                                onChange={(e) => examForm.formik.setFieldValue('passingMarks', parseInt(e.target.value))}
                                onBlur={examForm.formik.handleBlur}
                                required
                            />
                            <FormField
                                label="Exam Date"
                                name="examDate"
                                type="date"
                                icon={<Calendar className="h-4 w-4"/>}
                                value={examForm.formik.values.examDate}
                                error={examForm.formik.touched.examDate && examForm.formik.errors.examDate}
                                onChange={examForm.formik.handleChange}
                                onBlur={examForm.formik.handleBlur}
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={examForm.isSubmitting} className="gap-2">
                                {editingExam ? 'Update' : 'Create'} Exam
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Marks Entry Dialog — inline table editor, unchanged */}
            <Dialog open={marksDialogOpen} onOpenChange={setMarksDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <ClipboardCheck className="h-4 w-4 text-emerald-600"/>
                            </div>
                            Enter Marks: {selectedExam?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {classMarksData && (
                        <>
                            <div
                                className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Class</p>
                                    <p className="text-sm font-semibold">{selectedExam?.class?.name}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subject</p>
                                    <p className="text-sm font-semibold">{selectedExam?.subject?.name}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total
                                        Marks</p>
                                    <p className="text-sm font-semibold">{selectedExam?.totalMarks}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pass
                                        Marks</p>
                                    <p className="text-sm font-semibold">{selectedExam?.passingMarks}</p>
                                </div>
                            </div>

                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                                            <TableHead className="font-semibold w-20">Roll No</TableHead>
                                            <TableHead className="font-semibold">Student Name</TableHead>
                                            <TableHead className="font-semibold w-[130px]">Marks
                                                (/{selectedExam?.totalMarks})</TableHead>
                                            <TableHead className="font-semibold">Remarks</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {marksEntries.map((entry, index) => (
                                            <TableRow key={entry.studentId}
                                                      className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                                <TableCell
                                                    className="font-mono text-sm text-muted-foreground">{entry.rollNumber}</TableCell>
                                                <TableCell className="font-medium">{entry.studentName}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={entry.obtainedMarks}
                                                        onChange={(e) => handleMarksChange(entry.studentId, 'obtainedMarks', e.target.value)}
                                                        min="0"
                                                        max={selectedExam?.totalMarks}
                                                        className="w-20 h-8 text-sm"
                                                        placeholder="--"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={entry.remarks}
                                                        onChange={(e) => handleMarksChange(entry.studentId, 'remarks', e.target.value)}
                                                        placeholder="Optional remarks"
                                                        className="h-8 text-sm"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <DialogFooter className="pt-2">
                                <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
                                    <Users className="h-4 w-4"/>
                                    {marksEntries.filter(e => e.obtainedMarks !== '').length} of {marksEntries.length} filled
                                </div>
                                <Button variant="outline" onClick={() => setMarksDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSaveMarks} className="gap-2">
                                    <ClipboardCheck className="h-4 w-4"/>
                                    Save Marks
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}