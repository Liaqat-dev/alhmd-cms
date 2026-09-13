import {useEffect, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Card, CardContent} from '@/components/ui/card'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {marksAPI, teachersAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {ClipboardCheck, FileText, GraduationCap, Plus, Users} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const EXAM_TYPES = [
    {value: 'MONTHLY_TEST', label: 'Monthly Test'},
    {value: 'MIDTERM', label: 'Midterm'},
    {value: 'FINAL', label: 'Final'},
    {value: 'QUIZ', label: 'Quiz'},
    {value: 'ASSIGNMENT', label: 'Assignment'},
    {value: 'TASK', label: 'Task'},
]

const initialFormData = {
    name: '',
    examType: 'MONTHLY_TEST',
    classId: '',
    subjectId: '',
    totalMarks: 100,
    passingMarks: 40,
    examDate: '',
}

export default function TeacherMarks() {
    const [exams, setExams] = useState([])
    const [myClasses, setMyClasses] = useState([]) // one row per assigned class+subject pair
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [marksDialogOpen, setMarksDialogOpen] = useState(false)
    const [selectedExam, setSelectedExam] = useState(null)
    const [classMarksData, setClassMarksData] = useState(null)
    const [marksEntries, setMarksEntries] = useState([])
    const [formData, setFormData] = useState(initialFormData)
    const {toast} = useToast()

    // Classes the teacher is actually assigned to, deduped for the Class dropdown
    const myClassOptions = Array.from(
        new Map(myClasses.map(c => [c.classId, {id: c.classId, name: c.className}])).values()
    )
    // Only the subjects the teacher is assigned to within the selected class.
    // Compared as strings since Select values may round-trip as either type.
    const subjects = formData.classId
        ? myClasses
            .filter(c => String(c.classId) === String(formData.classId))
            .map(c => ({id: c.subjectId, name: c.subjectName}))
        : []

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [examsRes, classesRes] = await Promise.all([
                marksAPI.getTeacherExams(),
                teachersAPI.getMyClasses()
            ])
            setExams(examsRes.data.exams)
            setMyClasses(classesRes.data.classes || [])
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

    const handleOpenDialog = () => {
        setFormData(initialFormData)
        setDialogOpen(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await marksAPI.createExam(formData)
            toast({title: 'Success', description: 'Exam created successfully'})
            setDialogOpen(false)
            fetchData()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Operation failed',
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

    return (
        <DashboardLayout title="Marks Entry">
            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 xs:gap-4 mb-6">
                <Card className="relative overflow-hidden">
                    <CardContent className="p-3 xs:p-5">
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
                    <CardContent className="p-3 xs:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Marks Entered</p>
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
                    <CardContent className="p-3 xs:p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">My Classes</p>
                                <p className="text-3xl font-bold mt-1">{myClassOptions.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                <Users className="h-6 w-6 text-violet-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/80 to-violet-500/20"/>
                    </CardContent>
                </Card>
            </div>

            {/* Main Table */}
            <PagePanel
                icon={GraduationCap}
                title={'My Class Exams'}
                countLabel={'Create exams & Mark your classes'}
                addLabel={'Create Exam'}
                onAdd={handleOpenDialog}
            >
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                                <div className="h-4 w-32 bg-muted rounded"/>
                                <div className="h-5 w-20 bg-muted rounded-full"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
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
                        <h3 className="text-lg font-semibold mb-1">No exams yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Create your first exam to start entering marks for your students.
                        </p>
                        <Button onClick={handleOpenDialog} size="sm" className="gap-2">
                            <Plus className="h-4 w-4"/>
                            Create Exam
                        </Button>
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
                                    <TableCell
                                        className="text-sm">{new Date(exam.examDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                            (exam._count?.marks || 0) > 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-muted text-muted-foreground'
                        }`}>
                          {exam._count?.marks || 0} students
                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openMarksDialog(exam)}
                                                className="gap-1.5 h-8 text-xs"
                                            >
                                                <ClipboardCheck className="h-3.5 w-3.5"/>
                                                Enter Marks
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Create Exam Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <GraduationCap className="h-4 w-4 text-primary"/>
                            </div>
                            Create New Exam
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Exam Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g., First Monthly Test"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Exam Type</Label>
                                <Select
                                    value={formData.examType}
                                    onValueChange={(value) => setFormData({...formData, examType: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EXAM_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Class</Label>
                                <Select
                                    value={formData.classId}
                                    onValueChange={(value) => setFormData({...formData, classId: value, subjectId: ''})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {myClassOptions.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Subject</Label>
                            <Select
                                value={formData.subjectId}
                                onValueChange={(value) => setFormData({...formData, subjectId: value})}
                                disabled={!formData.classId}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={formData.classId ? "Select subject" : "Select a class first"}/>
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Total Marks</Label>
                                <Input
                                    type="number"
                                    value={formData.totalMarks}
                                    onChange={(e) => setFormData({...formData, totalMarks: parseInt(e.target.value)})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Pass Marks</Label>
                                <Input
                                    type="number"
                                    value={formData.passingMarks}
                                    onChange={(e) => setFormData({...formData, passingMarks: parseInt(e.target.value)})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Exam Date</Label>
                                <Input
                                    type="date"
                                    value={formData.examDate}
                                    onChange={(e) => setFormData({...formData, examDate: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="gap-2">
                                <Plus className="h-4 w-4"/>
                                Create Exam
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Marks Entry Dialog */}
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
