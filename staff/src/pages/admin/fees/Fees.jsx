import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {feesAPI, studentsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {useClasses} from '@/hooks/useClasses'
import {
    AlertCircle,
    Banknote,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    Receipt,
    Trash2,
    TrendingUp,
    Users,
} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 2, currentYear - 1, currentYear]

const MONTHS = [
    {value: 1, label: 'January'}, {value: 2, label: 'February'},
    {value: 3, label: 'March'}, {value: 4, label: 'April'},
    {value: 5, label: 'May'}, {value: 6, label: 'June'},
    {value: 7, label: 'July'}, {value: 8, label: 'August'},
    {value: 9, label: 'September'}, {value: 10, label: 'October'},
    {value: 11, label: 'November'}, {value: 12, label: 'December'},
]

export default function Fees() {
    const {classes} = useClasses()
    const [challans, setChallans] = useState([])
    const [students, setStudents] = useState([])
    const [statistics, setStatistics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [selectedChallan, setSelectedChallan] = useState(null)
    const [generateType, setGenerateType] = useState('single')
    const [filters, setFilters] = useState({
        classId: '', month: new Date().getMonth() + 1,
        year: new Date().getFullYear(), status: '',
    })
    const {toast} = useToast()

    const challanForm = useAppForm({
        initialValues: {
            classId: '', studentId: '', month: new Date().getMonth() + 1,
            year: new Date().getFullYear(), discount: 0, remarks: '',
        },
        onSubmit: async (values) => {
            if (generateType === 'single') {
                await feesAPI.generate({
                    studentId: values.studentId, month: values.month,
                    year: values.year, discount: values.discount, remarks: values.remarks,
                })
                return 'Challan generated successfully'
            } else {
                const res = await feesAPI.generateClass({
                    classId: values.classId, month: values.month, year: values.year,
                })
                return `${res.data.results.created} challans generated, ${res.data.results.skipped} skipped`
            }
        },
        onSuccess: (message) => {
            toast({title: 'Success', description: message})
            setDialogOpen(false)
            fetchData()
        },
    })

    const paymentForm = useAppForm({
        initialValues: {paidAmount: '', remarks: ''},
        onSubmit: async (values) => {
            await feesAPI.updatePayment(selectedChallan.id, values)
            return 'Payment updated successfully'
        },
        onSuccess: (message) => {
            toast({title: 'Success', description: message})
            setPaymentDialogOpen(false)
            setSelectedChallan(null)
            fetchData()
        },
    })

    useEffect(() => {
        fetchData()
    }, [filters])

    useEffect(() => {
        if (challanForm.formik.values.classId) {
            fetchStudents(challanForm.formik.values.classId)
            challanForm.formik.setFieldValue('studentId', '')
        } else {
            setStudents([])
        }
    }, [challanForm.formik.values.classId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [challansRes, statsRes] = await Promise.all([
                feesAPI.getAll(filters),
                feesAPI.getStatistics({month: filters.month, year: filters.year})
            ])
            setChallans(challansRes.data.challans)
            setStatistics(statsRes.data.statistics)
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch data'})
        } finally {
            setLoading(false)
        }
    }

    const fetchStudents = async (classId) => {
        try {
            const res = await studentsAPI.getByClass(classId)
            setStudents(res.data.students)
        } catch (error) {
            console.error('Failed to fetch students:', error)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this challan?')) return
        try {
            await feesAPI.delete(id)
            toast({title: 'Success', description: 'Challan deleted successfully'})
            fetchData()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete challan'
            })
        }
    }

    const openPaymentDialog = (challan) => {
        setSelectedChallan(challan)
        paymentForm.formik.resetForm({
            values: {paidAmount: challan.paidAmount || '', remarks: challan.remarks || ''},
        })
        setPaymentDialogOpen(true)
    }

    const openDetailDialog = (challan) => {
        setSelectedChallan(challan)
        setDetailDialogOpen(true)
    }

    const handleDownloadPDF = async (challan) => {
        try {
            const res = await feesAPI.downloadPDF(challan.id)
            const blob = new Blob([res.data], {type: 'application/pdf'})
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `challan-${challan.challanNumber}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to download PDF'})
        }
    }

    const getStatusBadge = (status) => {
        const config = {
            UNPAID: {bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-600/10', icon: Clock},
            PAID: {bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-600/10', icon: CheckCircle},
            PARTIAL: {bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-600/10', icon: TrendingUp},
            OVERDUE: {bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-600/10', icon: AlertCircle},
        }
        const c = config[status] || config.UNPAID
        const Icon = c.icon
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-md ${c.bg} ${c.text} ring-1 ring-inset ${c.ring} px-2 py-0.5 text-xs font-medium`}>
        <Icon className="h-3 w-3"/>{status}
      </span>
        )
    }

    const getMonthName = (month) => MONTHS.find(m => m.value === month)?.label || month

    const statCards = statistics ? [
        {
            label: 'Total Challans',
            value: statistics.totalChallans,
            icon: Receipt,
            gradient: 'from-blue-500/10 to-blue-600/5',
            iconColor: 'text-blue-600'
        },
        {
            label: 'Collected',
            value: `Rs. ${statistics.paidAmount?.toLocaleString()}`,
            icon: CheckCircle,
            gradient: 'from-emerald-500/10 to-emerald-600/5',
            iconColor: 'text-emerald-600'
        },
        {
            label: 'Pending',
            value: `Rs. ${statistics.pendingAmount?.toLocaleString()}`,
            icon: Clock,
            gradient: 'from-amber-500/10 to-amber-600/5',
            iconColor: 'text-amber-600'
        },
        {
            label: 'Overdue',
            value: statistics.overdueCount,
            icon: AlertCircle,
            gradient: 'from-rose-500/10 to-rose-600/5',
            iconColor: 'text-rose-600'
        },
    ] : []

    return (
        <div className="space-y-4">
            {statistics && (
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 sm:gap-4 lg:grid-cols-4">
                    {statCards.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <div key={stat.label}
                                 className="card p-3 sm:p-4 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-2.5 sm:gap-4">
                                    <div
                                        className={`flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} transition-transform group-hover:scale-105`}>
                                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`}/>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground leading-tight">{stat.label}</p>
                                        <p className="text-base sm:text-xl font-bold tracking-tight truncate leading-tight">{stat.value}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <PagePanel
                icon={DollarSign}
                title="Fee Challans"
                count={challans.length}
                countLabel="records found"
                addLabel="Generate"
                onAdd={() => {
                    challanForm.formik.resetForm();
                    setGenerateType('single');
                    setDialogOpen(true)
                }}
            >
                <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                    <Select value={filters.classId || "all"}
                            onValueChange={(value) => setFilters({...filters, classId: value === "all" ? "" : value})}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue
                            placeholder="All Classes"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((cls) => (<SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status || "all"}
                            onValueChange={(value) => setFilters({...filters, status: value === "all" ? "" : value})}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue
                            placeholder="All Status"/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="UNPAID">Unpaid</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="PARTIAL">Partial</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={String(filters.month)}
                            onValueChange={(value) => setFilters({...filters, month: parseInt(value)})}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue placeholder="Month"/></SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m) => (
                                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    <Select value={String(filters.year)}
                            onValueChange={(value) => setFilters({...filters, year: parseInt(value)})}>
                        <SelectTrigger className="w-full sm:w-35"><SelectValue placeholder="Year"/></SelectTrigger>
                        <SelectContent>
                            {YEARS.map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div
                            className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
                        <p className="text-sm text-muted-foreground">Loading challans...</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40">
                                <TableHead className="font-semibold">Challan #</TableHead>
                                <TableHead className="font-semibold">Student</TableHead>
                                <TableHead className="font-semibold">Class</TableHead>
                                <TableHead className="font-semibold">Month</TableHead>
                                <TableHead className="font-semibold text-right">Fee</TableHead>
                                <TableHead className="font-semibold text-right">Arrears</TableHead>
                                <TableHead className="font-semibold text-right">Total</TableHead>
                                <TableHead className="font-semibold text-right">Paid</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {challans.map((challan) => (
                                <TableRow key={challan.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell><span
                                        className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">{challan.challanNumber}</span></TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary flex-shrink-0">
                                                {challan.student?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{challan.student?.name}</p>
                                                <p className="text-xs text-muted-foreground">{challan.student?.rollNumber}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><span
                                        className="inline-flex items-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10 px-2 py-0.5 text-xs font-medium">{challan.student?.class?.name}</span></TableCell>
                                    <TableCell
                                        className="text-muted-foreground text-sm">{getMonthName(challan.month)} {challan.year}</TableCell>
                                    <TableCell
                                        className="text-right text-sm tabular-nums">Rs. {Number(challan.monthlyFee).toLocaleString()}</TableCell>
                                    <TableCell
                                        className="text-right text-sm tabular-nums text-muted-foreground">Rs. {Number(challan.arrears).toLocaleString()}</TableCell>
                                    <TableCell
                                        className="text-right font-semibold text-sm tabular-nums">Rs. {Number(challan.totalAmount).toLocaleString()}</TableCell>
                                    <TableCell
                                        className="text-right text-sm tabular-nums">Rs. {Number(challan.paidAmount).toLocaleString()}</TableCell>
                                    <TableCell>{getStatusBadge(challan.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => openDetailDialog(challan)}
                                                    title="View Breakdown"><Eye className="h-3.5 w-3.5"/></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleDownloadPDF(challan)}
                                                    title="Download PDF"><Download className="h-3.5 w-3.5"/></Button>
                                            {challan.status !== 'ROLLED_OVER' && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-50"
                                                        onClick={() => openPaymentDialog(challan)}
                                                        title="Record Payment"><CreditCard
                                                    className="h-3.5 w-3.5 text-emerald-600"/></Button>
                                            )}
                                            {challan.status !== 'PAID' && Number(challan.paidAmount) === 0 && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-rose-50"
                                                        onClick={() => handleDelete(challan.id)} title="Delete Challan"><Trash2
                                                    className="h-3.5 w-3.5 text-rose-500"/></Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {challans.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-32">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="rounded-full bg-muted p-3"><Receipt
                                                className="h-5 w-5 text-muted-foreground"/></div>
                                            <p className="text-sm text-muted-foreground">No challans found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Generate Challan Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Generate Fee Challan</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={challanForm.formik.handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant={generateType === 'single' ? 'default' : 'outline'}
                                    onClick={() => setGenerateType('single')} className="w-full">
                                <Banknote className="h-4 w-4 mr-2"/>Single Student
                            </Button>
                            <Button type="button" variant={generateType === 'class' ? 'default' : 'outline'}
                                    onClick={() => setGenerateType('class')} className="w-full">
                                <Users className="h-4 w-4 mr-2"/>Entire Class
                            </Button>
                        </div>

                        <ServerError message={challanForm.serverError} onDismiss={challanForm.clearServerError}/>

                        <FormSelect
                            label="Class"
                            name="classId"
                            icon={<Users className="h-4 w-4"/>}
                            placeholder="Select class"
                            value={challanForm.formik.values.classId}
                            error={challanForm.formik.touched.classId && challanForm.formik.errors.classId}
                            onChange={challanForm.formik.handleChange}
                            onBlur={challanForm.formik.handleBlur}
                            options={classes.map(cls => ({value: cls.id, label: cls.name}))}
                            required
                        />

                        {generateType === 'single' && (
                            <FormSelect
                                label="Student"
                                name="studentId"
                                icon={<Users className="h-4 w-4"/>}
                                placeholder={challanForm.formik.values.classId ? 'Select student' : 'Select a class first'}
                                value={challanForm.formik.values.studentId}
                                error={challanForm.formik.touched.studentId && challanForm.formik.errors.studentId}
                                onChange={challanForm.formik.handleChange}
                                onBlur={challanForm.formik.handleBlur}
                                options={students.map(s => ({value: s.id, label: `${s.name} (${s.rollNumber})`}))}
                                disabled={!challanForm.formik.values.classId}
                                required
                            />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <FormSelect
                                label="Month"
                                name="month"
                                icon={<Calendar className="h-4 w-4"/>}
                                value={String(challanForm.formik.values.month)}
                                onChange={(e) => challanForm.formik.setFieldValue('month', parseInt(e.target.value))}
                                onBlur={challanForm.formik.handleBlur}
                                options={MONTHS.map(m => ({value: String(m.value), label: m.label}))}
                                required
                            />
                            <FormField
                                label="Year"
                                name="year"
                                type="number"
                                icon={<Calendar className="h-4 w-4"/>}
                                value={String(challanForm.formik.values.year)}
                                onChange={(e) => challanForm.formik.setFieldValue('year', parseInt(e.target.value))}
                                onBlur={challanForm.formik.handleBlur}
                                required
                            />
                        </div>

                        {generateType === 'single' && (
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    label="Concession (Rs.)"
                                    name="discount"
                                    type="number"
                                    icon={<Banknote className="h-4 w-4"/>}
                                    value={String(challanForm.formik.values.discount)}
                                    onChange={(e) => challanForm.formik.setFieldValue('discount', parseFloat(e.target.value) || 0)}
                                    onBlur={challanForm.formik.handleBlur}
                                    placeholder="0"
                                />
                                <FormField
                                    label="Remarks"
                                    name="remarks"
                                    icon={<Receipt className="h-4 w-4"/>}
                                    value={challanForm.formik.values.remarks}
                                    onChange={challanForm.formik.handleChange}
                                    onBlur={challanForm.formik.handleBlur}
                                    placeholder="Optional"
                                />
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={challanForm.isSubmitting}>
                                Generate {generateType === 'class' ? 'Challans' : 'Challan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg">Record Payment</DialogTitle>
                    </DialogHeader>
                    {selectedChallan && (
                        <form onSubmit={paymentForm.formik.handleSubmit} className="space-y-4">
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <div className="flex items-center gap-3 pb-3 border-b">
                                    <div
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary">
                                        {selectedChallan.student?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{selectedChallan.student?.name}</p>
                                        <p className="text-xs text-muted-foreground">Challan
                                            #{selectedChallan.challanNumber}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div><p className="text-muted-foreground text-xs">Total Amount</p><p
                                        className="font-semibold">Rs. {Number(selectedChallan.totalAmount).toLocaleString()}</p>
                                    </div>
                                    <div><p className="text-muted-foreground text-xs">Already Paid</p><p
                                        className="font-semibold text-emerald-600">Rs. {Number(selectedChallan.paidAmount).toLocaleString()}</p>
                                    </div>
                                    <div><p className="text-muted-foreground text-xs">Balance</p><p
                                        className="font-semibold text-rose-600">Rs. {(Number(selectedChallan.totalAmount) - Number(selectedChallan.paidAmount)).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <ServerError message={paymentForm.serverError} onDismiss={paymentForm.clearServerError}/>

                            <FormField
                                label="Payment Amount (Rs.)"
                                name="paidAmount"
                                type="number"
                                icon={<DollarSign className="h-4 w-4"/>}
                                value={String(paymentForm.formik.values.paidAmount)}
                                error={paymentForm.formik.touched.paidAmount && paymentForm.formik.errors.paidAmount}
                                onChange={paymentForm.formik.handleChange}
                                onBlur={paymentForm.formik.handleBlur}
                                required
                            />
                            <FormField
                                label="Remarks"
                                name="remarks"
                                icon={<Receipt className="h-4 w-4"/>}
                                value={paymentForm.formik.values.remarks}
                                onChange={paymentForm.formik.handleChange}
                                onBlur={paymentForm.formik.handleBlur}
                                placeholder="Payment remarks"
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline"
                                        onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={paymentForm.isSubmitting}>Record Payment</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Fee Breakdown Dialog — read-only */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Fee Breakdown</DialogTitle></DialogHeader>
                    {selectedChallan && (
                        <div className="space-y-4">
                            <div className="text-sm text-muted-foreground">
                                {selectedChallan.student?.name} — {getMonthName(selectedChallan.month)} {selectedChallan.year}
                            </div>
                            {(selectedChallan.expenses || []).length > 0 && (
                                <div className="rounded-lg border overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/40">
                                                <TableHead className="font-semibold">#</TableHead>
                                                <TableHead className="font-semibold">Expense</TableHead>
                                                <TableHead className="font-semibold text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedChallan.expenses.map((exp, idx) => (
                                                <TableRow key={exp.id || idx}>
                                                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                                                    <TableCell className="font-medium">{exp.label || exp.type}</TableCell>
                                                    <TableCell
                                                        className="text-right tabular-nums">Rs. {Number(exp.amount).toLocaleString()}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-muted-foreground">Monthly Fee</span><span>Rs. {Number(selectedChallan.monthlyFee).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Additional Charges</span><span>Rs. {Number(selectedChallan.additionalCharges).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Arrears</span><span>Rs. {Number(selectedChallan.arrears).toLocaleString()}</span>
                                </div>
                                {Number(selectedChallan.lateFee) > 0 && (
                                    <div className="flex justify-between"><span className="text-muted-foreground">Late Fee</span><span>Rs. {Number(selectedChallan.lateFee).toLocaleString()}</span>
                                    </div>
                                )}
                                {Number(selectedChallan.discount) > 0 && (
                                    <div className="flex justify-between"><span className="text-muted-foreground">Concession</span><span>- Rs. {Number(selectedChallan.discount).toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Total</span><span>Rs. {Number(selectedChallan.totalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}