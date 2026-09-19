import * as XLSX from 'xlsx'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CalendarDays, ClipboardCheck, Download, Search } from 'lucide-react'

/**
 * AttendanceRegister — the monthly day-by-day register, shared by the student
 * and teacher panels.
 *
 * Both backends return the same shape ({ dates, rows with records + stats }),
 * so the grid, the legend and the Excel export live here once. Each panel
 * keeps its own filters and data fetching.
 *
 * Rows are normalised to: { id, name, subtitle, records, stats }
 */

export const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

export const YEARS = [2024, 2025, 2026, 2027]

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export const STATUS_CFG = {
    PRESENT: { label: 'P', cell: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' },
    ABSENT: { label: 'A', cell: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' },
    LEAVE: { label: 'L', cell: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
}

function pctColor(pct) {
    if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
    if (pct >= 75) return 'text-blue-600 dark:text-blue-400'
    if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-rose-600 dark:text-rose-400'
}

function pctBarColor(pct) {
    if (pct >= 90) return 'bg-emerald-500'
    if (pct >= 75) return 'bg-blue-500'
    if (pct >= 50) return 'bg-amber-500'
    return 'bg-rose-500'
}

// dateStr is a clean YYYY-MM-DD local date key from the backend
function parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return { day: date.getDate(), abbr: DAY_ABBR[date.getDay()] }
}

/**
 * Writes the register to an .xlsx file: one column per day, then the totals.
 * `subtitleLabel` is left out entirely when the rows have no subtitle.
 */
export function exportRegisterToExcel({ rows, dates, idLabel, nameLabel, subtitleLabel, sheetName, fileName }) {
    if (!dates.length) return

    const dateHeaders = dates.map(d => {
        const { day, abbr } = parseDate(d)
        return `${abbr} ${day}`
    })

    const header = [
        '#',
        idLabel,
        nameLabel,
        ...(subtitleLabel ? [subtitleLabel] : []),
        ...dateHeaders,
        'Present', 'Absent', 'Leave', 'Attendance %',
    ]

    const body = rows.map((r, i) => [
        i + 1,
        r.id,
        r.name,
        ...(subtitleLabel ? [r.subtitle || ''] : []),
        ...dates.map(d => (r.records[d] ? STATUS_CFG[r.records[d]].label : '')),
        r.stats.present,
        r.stats.absent,
        r.stats.leave,
        r.stats.total > 0 ? `${r.stats.percentage}%` : '',
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...body])

    ws['!cols'] = [
        { wch: 4 },
        { wch: 38 },
        { wch: 24 },
        ...(subtitleLabel ? [{ wch: 12 }] : []),
        ...dates.map(() => ({ wch: 5 })),
        { wch: 8 }, { wch: 7 }, { wch: 6 }, { wch: 13 },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31))
    XLSX.writeFile(wb, fileName)
}

export default function AttendanceRegister({
    title,
    periodLabel,
    rowHeading = 'Name',
    dates = [],
    rows = [],
    loading = false,
    search = null,
    onSearchChange,
    searchPlaceholder = 'Search…',
    onExport,
    emptyLabel = 'No attendance recorded',
    noMatchLabel = 'No results match your search',
}) {
    const hasGrid = dates.length > 0

    return (
        <div className="card overflow-hidden">
            {/* Panel header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500/10 flex-shrink-0">
                        <ClipboardCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold leading-tight">
                            {title}
                            {periodLabel && <span className="font-normal text-muted-foreground"> — {periodLabel}</span>}
                        </h2>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {search !== null && (
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                value={search}
                                onChange={e => onSearchChange?.(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="pl-8 h-8 text-xs w-36 sm:w-48"
                            />
                        </div>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        disabled={!hasGrid}
                        onClick={onExport}
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                </div>
            )}

            {/* Grid */}
            {!loading && hasGrid && (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border/60">
                                <th className="sticky left-0 z-10 bg-muted/40 text-left px-3 py-2.5 border-r border-border/40 min-w-[110px] sm:min-w-[100px]">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{rowHeading}</span>
                                </th>
                                {dates.map(date => {
                                    const { day, abbr } = parseDate(date)
                                    return (
                                        <th key={date} className="px-0 py-2 text-center min-w-[34px]">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-medium text-muted-foreground/60 uppercase">{abbr}</span>
                                                <span className="text-[11px] font-bold text-foreground tabular-nums">{day}</span>
                                            </div>
                                        </th>
                                    )
                                })}
                                <th className="px-2 py-2.5 text-center min-w-[32px] border-l border-border/40">
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">P</span>
                                </th>
                                <th className="px-2 py-2.5 text-center min-w-[32px]">
                                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">A</span>
                                </th>
                                <th className="px-2 py-2.5 text-center min-w-[32px]">
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">L</span>
                                </th>
                                <th className="px-3 py-2.5 text-center min-w-[64px]">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rate</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => {
                                const isAtRisk = row.stats.total > 0 && row.stats.percentage < 75
                                const isEven = i % 2 === 0
                                return (
                                    <tr
                                        key={row.id}
                                        className={cn(
                                            'border-b border-border/30 transition-colors',
                                            isAtRisk
                                                ? 'bg-rose-50/40 dark:bg-rose-500/5 hover:bg-rose-50/70 dark:hover:bg-rose-500/10'
                                                : isEven
                                                    ? 'hover:bg-muted/30'
                                                    : 'bg-muted/[0.025] hover:bg-muted/30'
                                        )}
                                    >
                                        <td className={cn(
                                            'sticky left-0 z-10 px-3 py-2 border-r border-border/40',
                                            isAtRisk
                                                ? 'bg-rose-50/40 dark:bg-rose-900/20'
                                                : isEven ? 'bg-background' : 'bg-muted/[0.025]'
                                        )}>
                                            <div className="flex items-center gap-2">
                                                {isAtRisk && (
                                                    <span className="w-[3px] h-[22px] rounded-full bg-rose-400 flex-shrink-0" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className={cn(
                                                        'text-[13px] font-medium leading-tight truncate',
                                                        isAtRisk && 'text-rose-700 dark:text-rose-400'
                                                    )}>
                                                        {row.name}
                                                    </p>
                                                    {row.subtitle && (
                                                        <p className="text-[10px] text-muted-foreground tabular-nums">{row.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {dates.map(date => {
                                            const status = row.records[date]
                                            const cfg = status ? STATUS_CFG[status] : null
                                            return (
                                                <td key={date} className="px-[3px] py-[5px] text-center">
                                                    {cfg ? (
                                                        <span className={cn(
                                                            'inline-flex items-center justify-center w-[26px] h-[26px] rounded-md text-[11px] font-bold select-none',
                                                            cfg.cell
                                                        )}>
                                                            {cfg.label}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-[26px] h-[26px] text-muted-foreground/25 text-base select-none">·</span>
                                                    )}
                                                </td>
                                            )
                                        })}

                                        <td className="px-2 py-2 text-center border-l border-border/40">
                                            <span className="text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{row.stats.present}</span>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <span className="text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">{row.stats.absent}</span>
                                        </td>
                                        <td className="px-2 py-2 text-center">
                                            <span className="text-xs font-semibold tabular-nums text-amber-600 dark:text-amber-400">{row.stats.leave}</span>
                                        </td>
                                        <td className="px-3 py-2">
                                            {row.stats.total > 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={cn('text-xs font-bold tabular-nums', pctColor(row.stats.percentage))}>
                                                        {row.stats.percentage}%
                                                    </span>
                                                    <div className="w-10 h-1 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className={cn('h-full rounded-full transition-all', pctBarColor(row.stats.percentage))}
                                                            style={{ width: `${row.stats.percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/40 block text-center">—</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}

                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={dates.length + 5} className="py-10 text-center text-sm text-muted-foreground">
                                        {noMatchLabel}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty: nothing recorded for the selected period */}
            {!loading && !hasGrid && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="rounded-full bg-muted p-4">
                        <CalendarDays className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{emptyLabel}</p>
                    <p className="text-xs text-muted-foreground/60">No records found for this period</p>
                </div>
            )}

            {/* Legend */}
            {hasGrid && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 border-t border-border/40 bg-muted/20">
                    {Object.entries(STATUS_CFG).map(([key, cfg]) => (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold', cfg.cell)}>
                                {cfg.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground capitalize">{key.toLowerCase()}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-muted-foreground/30 text-base">·</span>
                        <span className="text-[11px] text-muted-foreground">No record</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-[3px] h-4 rounded-full bg-rose-400" />
                        <span className="text-[11px] text-muted-foreground">At risk (&lt;75%)</span>
                    </div>
                </div>
            )}
        </div>
    )
}
