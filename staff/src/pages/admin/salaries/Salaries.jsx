import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {salariesAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {
    Banknote,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Eye,
    Loader2,
    MessageSquare,
    Trash2,
    TrendingUp,
} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const MONTHS = [
    {value: 1, label: 'January'}, {value: 2, label: 'February'},
    {value: 3, label: 'March'}, {value: 4, label: 'April'},
    {value: 5, label: 'May'}, {value: 6, label: 'June'},
    {value: 7, label: 'July'}, {value: 8, label: 'August'},
    {value: 9, label: 'September'}, {value: 10, label: 'October'},
    {value: 11, label: 'November'}, {value: 12, label: 'December'},
]

const YEARS = [2024, 2025, 2026, 2027]

const STATUS_COLORS = {
    GENERATED: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    APPROVED: 'bg-blue-50 text-blue-700 ring-blue-600/10',
    PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
}

const formatCurrency = (amount) => `Rs. ${Number(amount || 0).toLocaleString()}`

export default function Salaries() {
    const [salaries, setSalaries] = useState([])
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: '',
    })
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
    const [breakdownDialogOpen, setBreakdownDialogOpen] = useState(false)
    const [selectedSalary, setSelectedSalary] = useState(null)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [statusTarget, setStatusTarget] = useState(null)
    const {toast} = useToast()

    const generateForm = useAppForm({
        initialValues: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        },
        onSubmit: async (values) => {
            const res = await salariesAPI.generateAll(values)
            return {message: res.data.message, month: values.month, year: values.year}
        },
        onSuccess: ({message, month, year}) => {
            toast({title: 'Success', description: message})
            setGenerateDialogOpen(false)
            setFilters(prev => ({...prev, month, year}))
            fetchData()
        },
    })

    const statusForm = useAppForm({
        initialValues: {remarks: ''},
        onSubmit: async (values) => {
            await salariesAPI.updateStatus(
                statusTarget.salary.id,
                {status: statusTarget.newStatus, remarks: values.remarks || undefined}
            )
            return statusTarget.newStatus.toLowerCase()
        },
        onSuccess: (status) => {
            toast({title: 'Success', description: `Salary ${status} successfully`})
            setStatusDialogOpen(false)
            fetchData()
        },
    })

    useEffect(() => {
        fetchData()
    }, [filters.month, filters.year, filters.status])

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = {month: filters.month, year: filters.year}
            if (filters.status) params.status = filters.status
            const [salaryRes, statsRes] = await Promise.all([
                salariesAPI.getAll(params),
                salariesAPI.getStatistics(params),
            ])
            setSalaries(salaryRes.data.salaries)
            setStatistics(statsRes.data.statistics)
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch salary data'})
        } finally {
            setLoading(false)
        }
    }

    const handleViewBreakdown = (salary) => {
        setSelectedSalary(salary)
        setBreakdownDialogOpen(true)
    }

    const handleOpenStatusDialog = (salary, newStatus) => {
        setStatusTarget({salary, newStatus})
        statusForm.formik.resetForm()
        setStatusDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this salary record?')) return
        try {
            await salariesAPI.delete(id)
            toast({title: 'Success', description: 'Salary record deleted'})
            fetchData()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete'
            })
        }
    }

    const stats = [
        {
            label: 'Total Payroll',
            value: formatCurrency(statistics?.totalPayroll),
            icon: DollarSign,
            color: 'from-violet-500/10 to-violet-600/5',
            textColor: 'text-violet-600'
        },
        {
            label: 'Average Salary',
            value: formatCurrency(statistics?.avgSalary),
            icon: TrendingUp,
            color: 'from-blue-500/10 to-blue-600/5',
            textColor: 'text-blue-600'
        },
        {
            label: 'Generated',
            value: statistics?.generated || 0,
            icon: Clock,
            color: 'from-amber-500/10 to-amber-600/5',
            textColor: 'text-amber-600'
        },
        {
            label: 'Approved',
            value: statistics?.approved || 0,
            icon: CheckCircle,
            color: 'from-emerald-500/10 to-emerald-600/5',
            textColor: 'text-emerald-600'
        },
    ]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xs:gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="card p-3 xs:p-5 mb-1">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${stat.color}`}>
                                    <Icon className={`h-5 w-5 ${stat.textColor}`}/>
                                </div>
                                <div><p className="text-xs text-muted-foreground">{stat.label}</p><p
                                    className="text-lg font-bold tracking-tight">{stat.value}</p></div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <PagePanel
                icon={Banknote}
                iconBg="bg-primary-500/10 dark:bg-primary-500/15"
                iconColor="text-primary-600 dark:text-primary-400"
                title="Salaries"
                count={salaries.length}
                countLabel={`records for ${MONTHS.find(m => m.value === filters.month)?.label} ${filters.year}`}
                addLabel="Generate"
                onAdd={() => {
                    generateForm.formik.resetForm()
                    setGenerateDialogOpen(true)
                }}
            >
                <div className="flex flex-wrap gap-3 mb-6">
                    <Select value={String(filters.month)}
                            onValueChange={(v) => setFilters({...filters, month: parseInt(v)})}>
                        <SelectTrigger className="w-full xs:w-35"><SelectValue placeholder="Month"/></SelectTrigger>
                        <SelectContent>{MONTHS.map((m) => (
                            <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={String(filters.year)}
                            onValueChange={(v) => setFilters({...filters, year: parseInt(v)})}>
                        <SelectTrigger className="w-full xs:w-35"><SelectValue placeholder="Year"/></SelectTrigger>
                        <SelectContent>{YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                    </Select>
                    <Select value={filters.status || 'all'}
                            onValueChange={(v) => setFilters({...filters, status: v === 'all' ? '' : v})}>
                        <SelectTrigger className="w-full xs:w-35"><SelectValue placeholder="Status"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="GENERATED">Generated</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
                        <p className="text-sm text-muted-foreground">Loading salary records...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="font-semibold">Teacher</TableHead>
                                <TableHead className="font-semibold text-right">Basic Salary</TableHead>
                                <TableHead className="font-semibold text-right">Additional Pay</TableHead>
                                <TableHead className="font-semibold text-right">Total</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salaries.map((salary) => (
                                <TableRow key={salary.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/15 to-violet-500/5 text-xs font-bold text-violet-600 flex-shrink-0">{salary.teacher?.name?.charAt(0).toUpperCase()}</div>
                                            <span className="font-medium">{salary.teacher?.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(salary.basicSalary)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatCurrency(salary.additionalPay)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(salary.totalSalary)}</TableCell>
                                    <TableCell><span
                                        className={`inline-flex items-center rounded-md ring-1 ring-inset px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[salary.status]}`}>{salary.status}</span></TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"
                                                    title="View Breakdown"
                                                    onClick={() => handleViewBreakdown(salary)}><Eye
                                                className="h-3.5 w-3.5"/></Button>
                                            {salary.status === 'GENERATED' &&
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-50"
                                                        title="Approve"
                                                        onClick={() => handleOpenStatusDialog(salary, 'APPROVED')}><CheckCircle
                                                    className="h-3.5 w-3.5 text-blue-500"/></Button>}
                                            {salary.status === 'APPROVED' &&
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50"
                                                        title="Mark as Paid"
                                                        onClick={() => handleOpenStatusDialog(salary, 'PAID')}><DollarSign
                                                    className="h-3.5 w-3.5 text-emerald-500"/></Button>}
                                            {salary.status === 'GENERATED' &&
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50"
                                                        title="Delete" onClick={() => handleDelete(salary.id)}><Trash2
                                                    className="h-3.5 w-3.5 text-rose-500"/></Button>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {salaries.length === 0 && (
                                <TableRow><TableCell colSpan={6} className="h-32">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className="rounded-full bg-muted p-3"><Banknote
                                            className="h-5 w-5 text-muted-foreground"/></div>
                                        <p className="text-sm text-muted-foreground">No salary records found</p></div>
                                </TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Generate Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Generate Salaries</DialogTitle></DialogHeader>
                    <form onSubmit={generateForm.formik.handleSubmit} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Generate salary slips for all teachers using their manually set salary amounts from their profiles.
                        </p>

                        <ServerError message={generateForm.serverError} onDismiss={generateForm.clearServerError}/>

                        <FormSelect
                            label="Month"
                            name="month"
                            icon={<Calendar className="h-4 w-4"/>}
                            value={String(generateForm.formik.values.month)}
                            onChange={(e) => generateForm.formik.setFieldValue('month', parseInt(e.target.value))}
                            onBlur={generateForm.formik.handleBlur}
                            options={MONTHS.map(m => ({value: String(m.value), label: m.label}))}
                            required
                        />
                        <FormSelect
                            label="Year"
                            name="year"
                            icon={<Calendar className="h-4 w-4"/>}
                            value={String(generateForm.formik.values.year)}
                            onChange={(e) => generateForm.formik.setFieldValue('year', parseInt(e.target.value))}
                            onBlur={generateForm.formik.handleBlur}
                            options={YEARS.map(y => ({value: String(y), label: String(y)}))}
                            required
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={generateForm.isSubmitting}>
                                {generateForm.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                Generate All
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Breakdown Dialog */}
            <Dialog open={breakdownDialogOpen} onOpenChange={setBreakdownDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Salary Breakdown — {selectedSalary?.teacher?.name}</DialogTitle></DialogHeader>
                    {selectedSalary && (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                {MONTHS.find(m => m.value === selectedSalary.month)?.label} {selectedSalary.year}
                            </p>
                            <div className="rounded-lg border divide-y">
                                <div className="flex justify-between text-sm px-3 py-2">
                                    <span className="text-muted-foreground">Basic Salary</span>
                                    <span className="font-medium">{formatCurrency(selectedSalary.basicSalary)}</span>
                                </div>
                                <div className="flex justify-between text-sm px-3 py-2">
                                    <span className="text-muted-foreground">Additional Pay</span>
                                    <span className="font-medium">{formatCurrency(selectedSalary.additionalPay)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center rounded-lg bg-primary/5 border border-primary/20 px-3 py-3">
                                <span className="font-semibold">Total Salary</span>
                                <span className="text-xl font-bold">{formatCurrency(selectedSalary.totalSalary)}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Status Dialog */}
            <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>{statusTarget?.newStatus === 'APPROVED' ? 'Approve Salary' : 'Mark as Paid'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={statusForm.formik.handleSubmit} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {statusTarget?.newStatus === 'APPROVED'
                                ? `Approve salary of ${formatCurrency(statusTarget?.salary?.totalSalary)} for ${statusTarget?.salary?.teacher?.name}?`
                                : `Mark salary of ${formatCurrency(statusTarget?.salary?.totalSalary)} for ${statusTarget?.salary?.teacher?.name} as paid?`}
                        </p>

                        <ServerError message={statusForm.serverError} onDismiss={statusForm.clearServerError}/>

                        <FormField
                            label="Remarks (optional)"
                            name="remarks"
                            icon={<MessageSquare className="h-4 w-4"/>}
                            value={statusForm.formik.values.remarks}
                            onChange={statusForm.formik.handleChange}
                            onBlur={statusForm.formik.handleBlur}
                            placeholder="Add any notes..."
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline"
                                    onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={statusForm.isSubmitting}>
                                {statusForm.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {statusTarget?.newStatus === 'APPROVED' ? 'Approve' : 'Mark Paid'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
