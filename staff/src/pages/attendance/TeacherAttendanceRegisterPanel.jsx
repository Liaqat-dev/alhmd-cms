import { useState, useEffect, useMemo } from 'react'
import { attendanceAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AttendanceRegister, {
    MONTHS, YEARS, exportRegisterToExcel,
} from '@/components/shared/AttendanceRegister'

// Monthly attendance register for teachers — pick a month/year, see the
// day-by-day grid with per-teacher stats and an Excel export. Same register as
// the student one; teachers just have no class to pick and no roll number.
export default function TeacherAttendanceRegisterPanel() {
    const [month, setMonth] = useState(new Date().getMonth() + 1)
    const [year, setYear] = useState(new Date().getFullYear())
    const [gridData, setGridData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')

    const { toast } = useToast()

    const monthLabel = MONTHS.find(m => m.value === month)?.label

    useEffect(() => {
        fetchGrid()
    }, [month, year])

    async function fetchGrid() {
        try {
            setLoading(true)
            const res = await attendanceAPI.getTeacherGrid({ month, year })
            setGridData(res.data)
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load teacher attendance' })
        } finally {
            setLoading(false)
        }
    }

    const allRows = useMemo(() => (gridData?.teachers || []).map(t => ({
        id: t.teacherId,
        name: t.name,
        subtitle: null,
        records: t.records,
        stats: t.stats,
    })), [gridData])

    const rows = useMemo(() => {
        if (!search.trim()) return allRows
        const q = search.toLowerCase()
        return allRows.filter(r => r.name.toLowerCase().includes(q))
    }, [allRows, search])

    function downloadExcel() {
        exportRegisterToExcel({
            rows: allRows,
            dates: gridData?.dates || [],
            idLabel: 'Teacher ID',
            nameLabel: 'Teacher',
            subtitleLabel: null,
            sheetName: `Teachers - ${monthLabel} ${year}`,
            fileName: ['Teachers', monthLabel, year].join('_').replace(/\s+/g, '_') + '.xlsx',
        })
    }

    return (
        <div className="space-y-4">

            {/* Filters */}
            <div className="w-full flex flex-row justify-between gap-3 flex-wrap">
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:flex-wrap">
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

            {/* Register */}
            <AttendanceRegister
                title="Teachers"
                periodLabel={`${monthLabel} ${year}`}
                rowHeading="Teacher"
                dates={gridData?.dates || []}
                rows={rows}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search teacher…"
                onExport={downloadExcel}
                emptyLabel={`No attendance recorded for ${monthLabel} ${year}`}
                noMatchLabel="No teachers match your search"
            />

        </div>
    )
}
