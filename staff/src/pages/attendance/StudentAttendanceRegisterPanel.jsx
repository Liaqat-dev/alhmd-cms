import { useState, useEffect, useMemo } from 'react'
import { attendanceAPI } from '@/services/api'
import { useClasses } from '@/hooks/useClasses'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardCheck } from 'lucide-react'
import AttendanceRegister, {
    MONTHS, YEARS, exportRegisterToExcel,
} from '@/components/shared/AttendanceRegister'

// Monthly attendance register for students of a class — pick a class, month
// and year, see a day-by-day grid with per-student stats and an Excel export.
export default function StudentAttendanceRegisterPanel() {
    const [selectedClassId, setSelectedClassId] = useState('')
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [gridData, setGridData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    const { classes } = useClasses()
    const { toast } = useToast()

    // Reset grid when class changes. Loading is raised here rather than waiting
    // for the fetch effect, so the empty state never flashes in between.
    useEffect(() => {
        setGridData(null)
        if (selectedClassId) setLoading(true)
    }, [selectedClassId])

    useEffect(() => {
        if (!selectedClassId) return
        fetchGrid()
    }, [selectedClassId, month, year])

    async function fetchGrid() {
        try {
            setLoading(true)
            const res = await attendanceAPI.getClassGrid(selectedClassId, { month, year })
            setGridData(res.data)
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load attendance data' })
        } finally {
            setLoading(false)
        }
    }

    const allRows = useMemo(() => (gridData?.students || []).map(s => ({
        id: s.studentId,
        name: s.name,
        subtitle: s.rollNumber,
        records: s.records,
        stats: s.stats,
    })), [gridData])

    const rows = useMemo(() => {
        if (!search.trim()) return allRows
        const q = search.toLowerCase()
        return allRows.filter(r =>
            r.name.toLowerCase().includes(q) || (r.subtitle || '').toLowerCase().includes(q)
        )
    }, [allRows, search])

    const selectedClass = classes.find(c => c.id === selectedClassId)
    const monthLabel = MONTHS.find(m => m.value === month)?.label

    function downloadExcel() {
        const className = selectedClass?.name ?? 'Class'
        exportRegisterToExcel({
            rows: allRows,
            dates: gridData?.dates || [],
            idLabel: 'Student ID',
            nameLabel: 'Student',
            subtitleLabel: 'Roll No',
            sheetName: `${className} - ${monthLabel} ${year}`,
            fileName: [className, monthLabel, year].filter(Boolean).join('_').replace(/\s+/g, '_') + '.xlsx',
        })
    }

    return (
        <div className="space-y-4">

            {/* ── Filters ─────────────────────────────────────────── */}
            <div className="w-full flex flex-row justify-between gap-3 flex-wrap">
                <div className="grid grid-cols-3 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap">
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-full sm:w-35">
                            <SelectValue placeholder="Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={String(month)} onValueChange={v => setMonth(parseInt(v))}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label.slice(0, 3).toUpperCase()}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={String(year)} onValueChange={v => setYear(parseInt(v))}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── Register ────────────────────────────────────────── */}
            {selectedClassId ? (
                <AttendanceRegister
                    title={selectedClass?.name}
                    periodLabel={`${monthLabel} ${year}`}
                    rowHeading="Student"
                    dates={gridData?.dates || []}
                    rows={rows}
                    loading={loading}
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search student…"
                    onExport={downloadExcel}
                    emptyLabel={`No attendance recorded for ${monthLabel} ${year}`}
                    noMatchLabel="No students match your search"
                />
            ) : (
                <div className="card flex flex-col items-center justify-center py-20 gap-3">
                    <div className="rounded-full bg-muted/60 p-5">
                        <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">Select a class to view attendance</p>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                        Choose a class from the filters above to load the full monthly attendance register
                    </p>
                </div>
            )}

        </div>
    )
}
