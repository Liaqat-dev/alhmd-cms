import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { marksAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  AlertCircle,
  BarChart3,
  X,
} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

// Mirrors backend calculateGrade so subject aggregates match server-side grading
const calcGrade = (obtained, total) => {
  if (!total) return 'U'
  const pct = (obtained / total) * 100
  if (pct >= 90) return 'A*'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B'
  if (pct >= 60) return 'C'
  if (pct >= 50) return 'D'
  if (pct >= 40) return 'E'
  return 'U'
}

// "AS-English" — prefixes the subject with its class name when available
const subjectLabel = (className, subjectName) =>
  className ? `${className}-${subjectName}` : subjectName

export default function StudentMarks() {
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const marksRes = await marksAPI.getMyMarks()
      setMarks(marksRes.data.marks)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch marks',
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter option sources (derived from the full, unfiltered dataset)
  const subjectOptions = useMemo(() => {
    const map = new Map()
    for (const m of marks) {
      const id = m.exam.subject?.id
      if (id && !map.has(id)) {
        map.set(id, subjectLabel(m.exam.class?.name, m.exam.subject?.name))
      }
    }
    return [...map.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [marks])

  const yearOptions = useMemo(() => {
    const set = new Set(marks.map(m => new Date(m.exam.examDate).getFullYear()))
    return [...set].sort((a, b) => b - a)
  }, [marks])

  // Apply the active filters client-side
  const filteredMarks = useMemo(() => marks.filter(m => {
    const d = new Date(m.exam.examDate)
    if (subjectFilter !== 'all' && m.exam.subject?.id !== subjectFilter) return false
    if (yearFilter !== 'all' && d.getFullYear() !== Number(yearFilter)) return false
    if (monthFilter !== 'all' && d.getMonth() + 1 !== Number(monthFilter)) return false
    return true
  }), [marks, subjectFilter, monthFilter, yearFilter])

  // Statistics recomputed over the filtered set
  const statistics = useMemo(() => {
    const stats = { totalExams: filteredMarks.length, averagePercentage: 0, passed: 0, failed: 0 }
    if (filteredMarks.length > 0) {
      let totalPct = 0
      for (const m of filteredMarks) {
        totalPct += (Number(m.obtainedMarks) / m.exam.totalMarks) * 100
        if (Number(m.obtainedMarks) >= m.exam.passingMarks) stats.passed++
        else stats.failed++
      }
      stats.averagePercentage = (totalPct / filteredMarks.length).toFixed(2)
    }
    return stats
  }, [filteredMarks])

  // Subject-wise breakdown built from the filtered set
  const subjectWise = useMemo(() => {
    const map = {}
    for (const m of filteredMarks) {
      const sid = m.exam.subject?.id
      if (!sid) continue
      if (!map[sid]) {
        map[sid] = {
          subjectId: sid,
          subjectName: m.exam.subject.name,
          className: m.exam.class?.name || null,
          exams: [],
          totalObtained: 0,
          totalPossible: 0,
        }
      }
      map[sid].exams.push({
        examName: m.exam.name,
        examType: m.exam.examType,
        examDate: m.exam.examDate,
        obtainedMarks: m.obtainedMarks,
        totalMarks: m.exam.totalMarks,
        grade: m.grade,
      })
      map[sid].totalObtained += Number(m.obtainedMarks)
      map[sid].totalPossible += m.exam.totalMarks
    }
    return Object.values(map).map(s => ({
      ...s,
      percentage: s.totalPossible > 0 ? ((s.totalObtained / s.totalPossible) * 100).toFixed(2) : '0.00',
      grade: calcGrade(s.totalObtained, s.totalPossible),
    }))
  }, [filteredMarks])

  const filtersActive = subjectFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all'
  const clearFilters = () => {
    setSubjectFilter('all')
    setMonthFilter('all')
    setYearFilter('all')
  }

  const getGradeBadge = (grade) => {
    const config = {
      'A+': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'A': { bg: 'bg-emerald-50', text: 'text-emerald-700' },
      'B+': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'B': { bg: 'bg-blue-50', text: 'text-blue-700' },
      'C': { bg: 'bg-amber-50', text: 'text-amber-700' },
      'D': { bg: 'bg-orange-50', text: 'text-orange-700' },
      'F': { bg: 'bg-rose-50', text: 'text-rose-700' },
    }
    const style = config[grade] || { bg: 'bg-muted', text: 'text-muted-foreground' }
    return (
      <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md text-xs font-bold ${style.bg} ${style.text}`}>
        {grade}
      </span>
    )
  }

  const getExamTypeBadge = (type) => {
    const config = {
      MONTHLY_TEST: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      MIDTERM: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
      FINAL: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
      QUIZ: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      ASSIGNMENT: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      TASK: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
    }
    const style = config[type] || config.MONTHLY_TEST
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
        {type.replace('_', ' ')}
      </span>
    )
  }

  return (
    <DashboardLayout title="My Marks">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Exams</p>
                <p className="text-3xl font-bold mt-1">{statistics?.totalExams || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average</p>
                <p className="text-3xl font-bold mt-1">{statistics?.averagePercentage || 0}%</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Passed</p>
                <p className="text-3xl font-bold mt-1 text-emerald-600">{statistics?.passed || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/20" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-3xl font-bold mt-1 text-rose-600">{statistics?.failed || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/80 to-rose-500/20" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjectOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="All Months" />
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
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {yearOptions.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtersActive && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1.5 text-muted-foreground">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="all" className="gap-2 data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            All Exams
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-2 data-[state=active]:shadow-sm">
            <BookOpen className="h-4 w-4" />
            Subject-wise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PagePanel
          icon={GraduationCap}
          title={'Exam Results'}
          countLabel={'Your performance across all examinations'}
          >
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-5 w-20 bg-muted rounded-full" />
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-4 w-12 bg-muted rounded" />
                      <div className="h-5 w-8 bg-muted rounded" />
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredMarks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {marks.length === 0 ? 'No exam results yet' : 'No results match your filters'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {marks.length === 0
                      ? 'Your exam results will appear here once they are entered by your teachers.'
                      : 'Try adjusting or clearing the selected filters.'}
                  </p>
                </div>
              ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="font-semibold">Exam</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Subject</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-center">Score</TableHead>
                        <TableHead className="font-semibold text-center">%</TableHead>
                        <TableHead className="font-semibold text-center">Grade</TableHead>
                        <TableHead className="font-semibold text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMarks.map((mark, index) => {
                        const percentage = ((Number(mark.obtainedMarks) / mark.exam.totalMarks) * 100).toFixed(1)
                        const passed = Number(mark.obtainedMarks) >= mark.exam.passingMarks
                        return (
                          <TableRow key={mark.id} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                            <TableCell className="font-medium">{mark.exam.name}</TableCell>
                            <TableCell>{getExamTypeBadge(mark.exam.examType)}</TableCell>
                            <TableCell className="text-muted-foreground">{subjectLabel(mark.exam.class?.name, mark.exam.subject?.name)}</TableCell>
                            <TableCell className="text-sm">{new Date(mark.exam.examDate).toLocaleDateString()}</TableCell>
                            <TableCell className="text-center">
                              <span className="font-mono text-sm font-semibold">{Number(mark.obtainedMarks)}</span>
                              <span className="text-muted-foreground text-xs">/{mark.exam.totalMarks}</span>
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">{percentage}%</TableCell>
                            <TableCell className="text-center">{getGradeBadge(mark.grade)}</TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                passed
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                {passed ? 'Passed' : 'Failed'}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
              )}
          </PagePanel>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectWise.map((subject) => {
              const pct = parseFloat(subject.percentage)
              return (
                <Card key={subject.subjectId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {subjectLabel(subject.className, subject.subjectName)}
                      </CardTitle>
                      {getGradeBadge(subject.grade)}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between items-baseline text-sm mb-2">
                          <span className="font-semibold">{subject.percentage}%</span>
                          <span className="text-xs text-muted-foreground">{subject.totalObtained}/{subject.totalPossible}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Exam Breakdown */}
                      <div className="space-y-1.5">
                        {subject.exams.map((exam, idx) => {
                          const examPct = ((Number(exam.obtainedMarks) / exam.totalMarks) * 100).toFixed(0)
                          return (
                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium">{exam.examName}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {new Date(exam.examDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-sm font-mono">
                                  {Number(exam.obtainedMarks)}/{exam.totalMarks}
                                  <span className="text-muted-foreground ml-1 text-xs">({examPct}%)</span>
                                </span>
                                {getGradeBadge(exam.grade)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {subjectWise.length === 0 && !loading && (
              <Card className="col-span-2">
                <CardContent className="py-16 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4 mx-auto">
                    <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No subject data available</h3>
                  <p className="text-sm text-muted-foreground">Subject-wise breakdown will appear once exam results are available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
