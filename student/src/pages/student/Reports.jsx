import {useEffect, useMemo, useState} from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {reportsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {
    Award,
    BarChart3,
    Calendar,
    Download,
    Eye,
    FileText,
    MessageSquare,
    Printer,
    TrendingUp,
    X,
} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";
import {printReport} from '@/utils/printReport'

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

export default function StudentReports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [printingId, setPrintingId] = useState(null)
    const [downloadingId, setDownloadingId] = useState(null)
    const [monthFilter, setMonthFilter] = useState('all')
    const [yearFilter, setYearFilter] = useState('all')
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)
    const [viewLoading, setViewLoading] = useState(false)
    const {toast} = useToast()

    useEffect(() => {
        fetchReports()
    }, [])

    const yearOptions = useMemo(() => {
        const set = new Set(reports.map(r => r.year))
        return [...set].sort((a, b) => b - a)
    }, [reports])

    const filteredReports = useMemo(() => reports.filter(r => {
        if (monthFilter !== 'all' && r.month !== Number(monthFilter)) return false
        if (yearFilter !== 'all' && r.year !== Number(yearFilter)) return false
        return true
    }), [reports, monthFilter, yearFilter])

    const filtersActive = monthFilter !== 'all' || yearFilter !== 'all'
    const clearFilters = () => {
        setMonthFilter('all')
        setYearFilter('all')
    }

    const fetchReports = async () => {
        try {
            const res = await reportsAPI.getMyReports()
            setReports(res.data.reports)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch reports',
            })
        } finally {
            setLoading(false)
        }
    }

    const getMonthName = (month) => {
        return MONTHS.find(m => m.value === month)?.label || month
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

    const handleView = async (report) => {
        setViewDialogOpen(true)
        setViewLoading(true)
        try {
            const res = await reportsAPI.getById(report.id)
            setSelectedReport(res.data)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch report details'})
            setViewDialogOpen(false)
        } finally {
            setViewLoading(false)
        }
    }

    const handleDownload = async (report) => {
        setDownloadingId(report.id)
        try {
            const res = await reportsAPI.downloadPDF(report.id)
            const blob = new Blob([res.data], {type: 'application/pdf'})
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `report-${report.student?.rollNumber || report.id}-${report.month}-${report.year}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to download PDF'})
        } finally {
            setDownloadingId(null)
        }
    }

    const latestReport = filteredReports[0]

    return (
        <DashboardLayout title="My Reports">
            {!loading && reports.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-[150px] h-9">
                            <SelectValue placeholder="All Months"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Months</SelectItem>
                            {MONTHS.map(m => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[120px] h-9">
                            <SelectValue placeholder="All Years"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Years</SelectItem>
                            {yearOptions.map(y => (
                                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {filtersActive && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}
                                className="h-9 gap-1.5 text-muted-foreground">
                            <X className="h-3.5 w-3.5"/>
                            Clear
                        </Button>
                    )}
                </div>
            )}
            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-5">
                                    <div className="h-4 w-20 bg-muted rounded mb-2"/>
                                    <div className="h-8 w-16 bg-muted rounded"/>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <Card className="animate-pulse">
                        <CardContent className="p-6 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-24 bg-muted/30 rounded-xl"/>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            ) : reports.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <div
                            className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 mx-auto">
                            <FileText className="h-8 w-8 text-muted-foreground/60"/>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No Reports Available</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                            Monthly reports will appear here once they are generated by the administration.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Latest Report Summary */}
          {latestReport && (
              <div className="mb-6">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Latest Report: {getMonthName(latestReport.month)} {latestReport.year}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="relative overflow-hidden">
                          <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                                      <p className={`text-3xl font-bold mt-1 ${
                                          Number(latestReport.attendancePercentage) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                                      }`}>
                                          {Number(latestReport.attendancePercentage).toFixed(1)}%
                                      </p>
                                  </div>
                                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                                      Number(latestReport.attendancePercentage) >= 75 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                  }`}>
                                      <Calendar className={`h-6 w-6 ${
                                          Number(latestReport.attendancePercentage) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                                      }`}/>
                                  </div>
                              </div>
                              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                                  Number(latestReport.attendancePercentage) >= 75
                                      ? 'from-emerald-500/80 to-emerald-500/20'
                                      : 'from-rose-500/80 to-rose-500/20'
                              }`}/>
                          </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden">
                          <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <p className="text-sm font-medium text-muted-foreground">Avg. Marks</p>
                                      <p className="text-3xl font-bold mt-1">
                                          {latestReport.averageMarks ? `${Number(latestReport.averageMarks).toFixed(1)}%` : 'N/A'}
                                      </p>
                                  </div>
                                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                                      latestReport.averageMarks && Number(latestReport.averageMarks) >= 50 ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                  }`}>
                                      <TrendingUp className={`h-6 w-6 ${
                                          latestReport.averageMarks && Number(latestReport.averageMarks) >= 50 ? 'text-emerald-600' : 'text-amber-600'
                                      }`}/>
                                  </div>
                              </div>
                              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${
                                  latestReport.averageMarks && Number(latestReport.averageMarks) >= 50
                                      ? 'from-emerald-500/80 to-emerald-500/20'
                                      : 'from-amber-500/80 to-amber-500/20'
                              }`}/>
                          </CardContent>
                      </Card>

                      <Card className="relative overflow-hidden">
                          <CardContent className="p-5">
                              <div className="flex items-center justify-between">
                                  <div>
                                      <p className="text-sm font-medium text-muted-foreground">Exams Passed</p>
                                      <p className="text-3xl font-bold mt-1">
                                          {latestReport.examsPassed}/{latestReport.totalExams}
                                      </p>
                                  </div>
                                  <div
                                      className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                      <Award className="h-6 w-6 text-violet-600"/>
                                  </div>
                              </div>
                              <div
                                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/80 to-violet-500/20"/>
                          </CardContent>
                      </Card>
                  </div>
              </div>
          )}

          {/* All Reports */}
                    <PagePanel
                        icon={FileText}
                        countLabel={'All Monthly Reports'}
                    >
                        <div className="space-y-3">
                            {filteredReports.length === 0 && (
                                <div className="py-12 text-center text-sm text-muted-foreground">
                                    No reports match the selected filters.
                                </div>
                            )}
                            {filteredReports.map((report) => {
                                const attendancePct = Number(report.attendancePercentage)
                                const marksPct = report.averageMarks ? Number(report.averageMarks) : 0

                                return (
                                    <div
                                        key={report.id}
                                        className="card p-5 hover:bg-muted/30 transition-colors"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-base">
                                                    {getMonthName(report.month)} {report.year}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 mt-2">
                            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5"/>
                                {attendancePct.toFixed(1)}% attendance
                            </span>
                                                    <span
                                                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                              <BarChart3 className="h-3.5 w-3.5"/>
                                                        {report.averageMarks ? `${marksPct.toFixed(1)}% marks` : 'N/A marks'}
                            </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-wrap sm:shrink-0">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleView(report)}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Eye className="h-3.5 w-3.5"/>
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePrint(report)}
                                                    disabled={printingId === report.id}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Printer className="h-3.5 w-3.5"/>
                                                    {printingId === report.id ? 'Loading...' : 'Print'}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownload(report)}
                                                    disabled={downloadingId === report.id}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Download className="h-3.5 w-3.5"/>
                                                    {downloadingId === report.id ? 'Downloading...' : 'PDF'}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Teacher Remarks */}
                                        {report.teacherRemarks && (
                                            <div
                                                className="mb-4 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
                                                <p className="text-xs text-amber-800 flex items-start gap-1.5">
                                                    <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-amber-600"/>
                                                    <span><span
                                                        className="font-medium">Teacher's Remarks:</span> {report.teacherRemarks}</span>
                                                </p>
                                            </div>
                                        )}

                                        {/* Progress Bars */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex justify-between items-baseline mb-1.5">
                                                    <span
                                                        className="text-xs font-medium text-muted-foreground">Attendance</span>
                                                    <span
                                                        className="text-xs font-bold">{attendancePct.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            attendancePct >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}
                                                        style={{width: `${Math.min(attendancePct, 100)}%`}}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-baseline mb-1.5">
                                                    <span
                                                        className="text-xs font-medium text-muted-foreground">Marks</span>
                                                    <span
                                                        className="text-xs font-bold">{report.averageMarks ? `${marksPct.toFixed(0)}%` : 'N/A'}</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-500 ${
                                                            marksPct >= 75 ? 'bg-emerald-500' : marksPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                        style={{width: `${Math.min(marksPct, 100)}%`}}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </PagePanel>
                </>
            )}

            {/* View Report Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Eye className="h-4 w-4 text-primary"/>
                            </div>
                            <span className="truncate">
                                {selectedReport?.report && (
                                    <>
                                        {getMonthName(selectedReport.report.month)} {selectedReport.report.year} Report
                                    </>
                                )}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {viewLoading ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">Loading report...</div>
                    ) : selectedReport && (
                        <div className="space-y-4 pt-2">
                            {/* Summary */}
                            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
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
                                        Present: {selectedReport.report.totalPresent} | Absent: {selectedReport.report.totalAbsent} | Leave: {selectedReport.report.totalLeave}
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
                            {selectedReport.report?.teacherRemarks && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Teacher's Remarks</p>
                                    <p className="text-sm text-amber-900">{selectedReport.report.teacherRemarks}</p>
                                </div>
                            )}

                            <DialogFooter className="pt-2">
                                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                                <Button
                                    variant="outline"
                                    onClick={() => printReport(selectedReport.report, selectedReport.details?.subjects || [])}
                                    className="gap-2"
                                >
                                    <Printer className="h-4 w-4"/>
                                    Print
                                </Button>
                                <Button
                                    onClick={() => handleDownload(selectedReport.report)}
                                    disabled={downloadingId === selectedReport.report.id}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4"/>
                                    {downloadingId === selectedReport.report.id ? 'Downloading...' : 'Download PDF'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
