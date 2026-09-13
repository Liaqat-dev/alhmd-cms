import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Card, CardContent} from '@/components/ui/card'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {reportsAPI, studentsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {printReport} from '@/utils/printReport'
import {
    BarChart3,
    Calendar,
    CheckCircle,
    Eye,
    FileText,
    Plus,
    Printer,
    TrendingUp,
    Users,
} from 'lucide-react'
import {PagePanel} from '@/components/shared/admin-table.jsx'

const MONTHS = [
    {value: 1, label: 'January'},
    {value: 2, label: 'February'},
    {value: 3, label: 'March'},
    {value: 4, label: 'April'},
    {value: 5, label: 'May'},
    {value: 6, label: 'June'},
    {value: 7, label: 'July'},
    {value: 8, label: 'August'},
    {value: 9, label: 'September'},
    {value: 10, label: 'October'},
    {value: 11, label: 'November'},
    {value: 12, label: 'December'},
]

const getMonthName = (month) => MONTHS.find(m => m.value === month)?.label || month

const getPerformanceBadge = (percentage) => {
    if (!percentage) return <span className="text-muted-foreground text-sm">N/A</span>
    const value = Number(percentage)
    const config = value >= 75
        ? {bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'}
        : value >= 50
            ? {bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500'}
            : {bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500'}
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}/>
            {value.toFixed(1)}%
        </span>
    )
}

/**
 * Shared reports panel used by Admin and Teacher.
 *
 * @param {object[]} availableClasses  - classes to show in the filter / generate dialog
 * @param {boolean}  canGenerate       - show Generate button (admin + teacher)
 * @param {boolean}  canEditRemarks    - allow editing teacher remarks (teacher only)
 */
export default function ReportsView({availableClasses = [], canGenerate = false, canEditRemarks = false}) {
    const {toast} = useToast()

    const [reports, setReports] = useState([])
    const [classSummary, setClassSummary] = useState(null)
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    const [filters, setFilters] = useState({
        classId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    })

    const [dialogOpen, setDialogOpen] = useState(false)
    const [generateType, setGenerateType] = useState('class')

    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)

    // Remarks editing state (teacher)
    const [remarksText, setRemarksText] = useState('')
    const [savingRemarks, setSavingRemarks] = useState(false)

    // Print loading state
    const [printingId, setPrintingId] = useState(null)

    // ── Helpers ────────────────────────────────────────────────────────────────

    const fetchData = async () => {
        try {
            setLoading(true)
            const reportsRes = await reportsAPI.getAll(filters)
            setReports(reportsRes.data.reports)

            if (filters.classId) {
                const summaryRes = await reportsAPI.getClassSummary(filters)
                setClassSummary(summaryRes.data.summary)
            } else {
                setClassSummary(null)
            }
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch data'})
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async (classId) => {
        try {
            const res = await studentsAPI.getByClass(classId)
            setStudents(res.data.students)
        } catch {
            // non-critical
        }
    }

    // ── Generate form ──────────────────────────────────────────────────────────

    const reportForm = useAppForm({
        initialValues: {
            classId: '',
            studentId: '',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        },
        onSubmit: async (values) => {
            if (generateType === 'class') {
                const res = await reportsAPI.generateClass(values)
                return `${res.data.results.generated} reports generated`
            } else {
                await reportsAPI.generate(values)
                return 'Report generated successfully'
            }
        },
        onSuccess: (message) => {
            toast({title: 'Success', description: message})
            setDialogOpen(false)
            fetchData()
        },
    })

    // ── Effects ────────────────────────────────────────────────────────────────

    useEffect(() => {
        fetchData()
    }, [filters])

    useEffect(() => {
        if (reportForm.formik.values.classId && generateType === 'single') {
            fetchStudents(reportForm.formik.values.classId)
            reportForm.formik.setFieldValue('studentId', '')
        }
    }, [reportForm.formik.values.classId, generateType])

    // ── View & print ───────────────────────────────────────────────────────────

    const viewReport = async (report) => {
        try {
            const res = await reportsAPI.getById(report.id)
            setSelectedReport(res.data)
            setRemarksText(res.data.report?.teacherRemarks || '')
            setViewDialogOpen(true)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch report details'})
        }
    }

    const handlePrint = async (report) => {
        setPrintingId(report.id)
        try {
            const res = await reportsAPI.getById(report.id)
            printReport(res.data.report, res.data.details?.subjects || [])
        } catch {
            printReport(report, [])
        } finally {
            setPrintingId(null)
        }
    }

    // ── Remarks save (teacher) ─────────────────────────────────────────────────

    const saveRemarks = async () => {
        if (!selectedReport) return
        setSavingRemarks(true)
        try {
            await reportsAPI.updateRemarks(selectedReport.report.id, {remarks: remarksText})
            setSelectedReport(prev => ({
                ...prev,
                report: {...prev.report, teacherRemarks: remarksText},
            }))
            toast({title: 'Saved', description: 'Remarks updated successfully'})
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to save remarks'})
        } finally {
            setSavingRemarks(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Class Summary Stats */}
            {classSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                                    <p className="text-3xl font-bold mt-1">{classSummary.totalStudents}</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary"/>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20"/>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Attendance</p>
                                    <p className="text-3xl font-bold mt-1">{classSummary.averageAttendance}%</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-emerald-600"/>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/20"/>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Marks</p>
                                    <p className="text-3xl font-bold mt-1">{classSummary.averageMarks}%</p>
                                </div>
                                <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-violet-600"/>
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/80 to-violet-500/20"/>
                        </CardContent>
                    </Card>

                </div>
            )}

            {/* Reports Table */}
            <PagePanel
                icon={FileText}
                title="Student Reports"
                countLabel="Monthly progress reports"
                addLabel={canGenerate ? 'Generate' : undefined}
                onAdd={canGenerate ? () => {
                    reportForm.formik.resetForm()
                    setGenerateType('class')
                    setDialogOpen(true)
                } : undefined}
            >
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <Select
                        value={filters.classId || 'all'}
                        onValueChange={(v) => setFilters({...filters, classId: v === 'all' ? '' : v})}
                    >
                        <SelectTrigger className="w-full xs:w-35">
                            <SelectValue placeholder="All Classes"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {availableClasses.map(cls => (
                                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(filters.month)}
                        onValueChange={(v) => setFilters({...filters, month: parseInt(v)})}
                    >
                        <SelectTrigger className="w-full xs:w-35">
                            <SelectValue placeholder="Month"/>
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map(m => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        value={filters.year}
                        onChange={(e) => setFilters({...filters, year: parseInt(e.target.value)})}
                        className="w-full xs:w-35"
                    />
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                                <div className="h-10 w-10 bg-muted rounded-full"/>
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-32 bg-muted rounded"/>
                                    <div className="h-3 w-20 bg-muted rounded"/>
                                </div>
                                <div className="h-4 w-20 bg-muted rounded"/>
                                <div className="h-6 w-16 bg-muted rounded-full"/>
                                <div className="h-6 w-16 bg-muted rounded-full"/>
                                <div className="h-8 w-20 bg-muted rounded"/>
                            </div>
                        ))}
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground/60"/>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No reports found</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            {canGenerate
                                ? 'Generate reports for the selected month to see student progress.'
                                : 'No reports have been generated for the selected period.'}
                        </p>
                        {canGenerate && (
                            <Button onClick={() => {
                                reportForm.formik.resetForm()
                                setGenerateType('class')
                                setDialogOpen(true)
                            }} size="sm" className="gap-2">
                                <Plus className="h-4 w-4"/>
                                Generate Reports
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-semibold">Student</TableHead>
                                <TableHead className="font-semibold">Class</TableHead>
                                <TableHead className="font-semibold">Month</TableHead>
                                <TableHead className="font-semibold text-center">Attendance</TableHead>
                                <TableHead className="font-semibold text-center">Marks</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.map((report, index) => (
                                <TableRow key={report.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                                                {report.student?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{report.student?.name}</p>
                                                <p className="text-xs text-muted-foreground">{report.student?.rollNumber}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">{report.student?.class?.name}</TableCell>
                                    <TableCell className="text-sm">{getMonthName(report.month)} {report.year}</TableCell>
                                    <TableCell className="text-center">{getPerformanceBadge(report.attendancePercentage)}</TableCell>
                                    <TableCell className="text-center">{getPerformanceBadge(report.averageMarks)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewReport(report)}
                                                className="gap-1.5 h-8 text-xs"
                                            >
                                                <Eye className="h-3.5 w-3.5"/>
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                disabled={printingId === report.id}
                                                onClick={() => handlePrint(report)}
                                            >
                                                <Printer className="h-3.5 w-3.5"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Generate Report Dialog */}
            {canGenerate && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-primary"/>
                                </div>
                                Generate Monthly Reports
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={reportForm.formik.handleSubmit} className="space-y-5 pt-2">
                            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setGenerateType('class')}
                                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                        generateType === 'class'
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Users className="h-4 w-4"/>
                                    Entire Class
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGenerateType('single')}
                                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                                        generateType === 'single'
                                            ? 'bg-background shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    Single Student
                                </button>
                            </div>

                            <ServerError message={reportForm.serverError} onDismiss={reportForm.clearServerError}/>

                            <FormSelect
                                label="Class"
                                name="classId"
                                icon={<Users className="h-4 w-4"/>}
                                placeholder="Select class"
                                value={reportForm.formik.values.classId}
                                error={reportForm.formik.touched.classId && reportForm.formik.errors.classId}
                                onChange={reportForm.formik.handleChange}
                                onBlur={reportForm.formik.handleBlur}
                                options={availableClasses.map(cls => ({value: cls.id, label: cls.name}))}
                                required
                            />

                            {generateType === 'single' && (
                                <FormSelect
                                    label="Student"
                                    name="studentId"
                                    icon={<Users className="h-4 w-4"/>}
                                    placeholder={reportForm.formik.values.classId ? 'Select student' : 'Select a class first'}
                                    value={reportForm.formik.values.studentId}
                                    error={reportForm.formik.touched.studentId && reportForm.formik.errors.studentId}
                                    onChange={reportForm.formik.handleChange}
                                    onBlur={reportForm.formik.handleBlur}
                                    options={students.map(s => ({value: s.id, label: `${s.name} (${s.rollNumber})`}))}
                                    disabled={!reportForm.formik.values.classId}
                                    required
                                />
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <FormSelect
                                    label="Month"
                                    name="month"
                                    icon={<Calendar className="h-4 w-4"/>}
                                    value={String(reportForm.formik.values.month)}
                                    onChange={(e) => reportForm.formik.setFieldValue('month', parseInt(e.target.value))}
                                    onBlur={reportForm.formik.handleBlur}
                                    options={MONTHS.map(m => ({value: String(m.value), label: m.label}))}
                                    required
                                />
                                <FormField
                                    label="Year"
                                    name="year"
                                    type="number"
                                    icon={<Calendar className="h-4 w-4"/>}
                                    value={String(reportForm.formik.values.year)}
                                    onChange={(e) => reportForm.formik.setFieldValue('year', parseInt(e.target.value))}
                                    onBlur={reportForm.formik.handleBlur}
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={reportForm.isSubmitting} className="gap-2">
                                    <FileText className="h-4 w-4"/>
                                    Generate {generateType === 'class' ? 'Reports' : 'Report'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}

            {/* View Report Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Eye className="h-4 w-4 text-primary"/>
                            </div>
                            {selectedReport?.report?.student?.name} &mdash; {getMonthName(selectedReport?.report?.month)} {selectedReport?.report?.year}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedReport && (
                        <div className="space-y-4 pt-2">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Attendance</p>
                                    </div>
                                    <p className="text-2xl font-bold">{Number(selectedReport.report.attendancePercentage).toFixed(1)}%</p>
                                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${Number(selectedReport.report.attendancePercentage) >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            style={{width: `${Math.min(Number(selectedReport.report.attendancePercentage), 100)}%`}}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Present: {selectedReport.report.totalPresent} | Absent: {selectedReport.report.totalAbsent} | Late: {selectedReport.report.totalLate}
                                    </p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-4 w-4 text-muted-foreground"/>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Academic</p>
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {selectedReport.report.averageMarks ? `${Number(selectedReport.report.averageMarks).toFixed(1)}%` : 'N/A'}
                                    </p>
                                    {selectedReport.report.averageMarks && (
                                        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                                            <div
                                                className={`h-1.5 rounded-full transition-all ${Number(selectedReport.report.averageMarks) >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{width: `${Math.min(Number(selectedReport.report.averageMarks), 100)}%`}}
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Exams: {selectedReport.report.totalExams} | Passed: {selectedReport.report.examsPassed}
                                    </p>
                                </div>
                            </div>

                            {/* Subject-wise breakdown */}
                            {selectedReport.details?.subjects?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-muted-foreground"/>
                                        Subject-wise Performance
                                    </h4>
                                    {selectedReport.details.subjects.map((subj) => (
                                        <div key={subj.subjectId} className="rounded-lg border overflow-hidden">
                                            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b">
                                                <span className="font-semibold text-sm">{subj.subjectName}</span>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>
                                                        <span className="font-medium text-foreground">
                                                            {subj.attendance.present}P / {subj.attendance.absent}A / {subj.attendance.late}L
                                                        </span>
                                                        {subj.attendancePercentage && (
                                                            <span className="ml-1 text-foreground font-medium">({subj.attendancePercentage}%)</span>
                                                        )}
                                                    </span>
                                                    {subj.percentage && (
                                                        <span className={`font-semibold ${Number(subj.percentage) >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {subj.percentage}%
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                        <TableHead className="font-semibold text-xs">Exam</TableHead>
                                                        <TableHead className="font-semibold text-xs">Type</TableHead>
                                                        <TableHead className="font-semibold text-xs text-center">Marks</TableHead>
                                                        <TableHead className="font-semibold text-xs text-center">Grade</TableHead>
                                                        <TableHead className="font-semibold text-xs">Remarks</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {subj.exams.map((exam, idx) => (
                                                        <TableRow key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                                                            <TableCell className="text-sm font-medium">{exam.title}</TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{exam.examType.replace(/_/g, ' ')}</TableCell>
                                                            <TableCell className="text-center font-mono text-sm">
                                                                {exam.notTaken ? (
                                                                    <span className="text-xs text-muted-foreground italic">Not taken</span>
                                                                ) : (
                                                                    <>
                                                                        <span className={Number(exam.obtainedMarks) >= exam.passingMarks ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                                                                            {Number(exam.obtainedMarks)}
                                                                        </span>
                                                                        <span className="text-muted-foreground">/{exam.totalMarks}</span>
                                                                    </>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {exam.notTaken ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">—</span>
                                                                ) : (
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${Number(exam.obtainedMarks) >= exam.passingMarks ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                        {exam.grade || '—'}
                                                                    </span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground italic">
                                                                {exam.notTaken ? '—' : (exam.remarks || '—')}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Teacher Remarks */}
                            {canEditRemarks ? (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Teacher's Remarks</p>
                                    <textarea
                                        value={remarksText}
                                        onChange={(e) => setRemarksText(e.target.value)}
                                        placeholder="Add remarks for this student..."
                                        rows={3}
                                        className="w-full rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm text-amber-900 placeholder:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                                    />
                                </div>
                            ) : (
                                selectedReport.report?.teacherRemarks && (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Teacher's Remarks</p>
                                        <p className="text-sm text-amber-900">{selectedReport.report.teacherRemarks}</p>
                                    </div>
                                )
                            )}

                            <DialogFooter className="pt-2">
                                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                                {canEditRemarks && (
                                    <Button
                                        variant="outline"
                                        onClick={saveRemarks}
                                        disabled={savingRemarks}
                                        className="gap-2"
                                    >
                                        {savingRemarks ? 'Saving...' : 'Save Remarks'}
                                    </Button>
                                )}
                                <Button
                                    onClick={() => printReport(selectedReport.report, selectedReport.details?.subjects || [])}
                                    className="gap-2"
                                >
                                    <Printer className="h-4 w-4"/>
                                    Print Report
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
