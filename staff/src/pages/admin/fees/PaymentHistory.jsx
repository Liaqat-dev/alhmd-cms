import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { feesAPI } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useClasses } from '@/hooks/useClasses'
import { CreditCard } from 'lucide-react'
import { PagePanel } from '@/components/shared/admin-table.jsx'

const currentYear = new Date().getFullYear()
const YEARS = [currentYear - 2, currentYear - 1, currentYear]

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' },
]

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'ONLINE', label: 'Online' },
]

export default function PaymentHistory() {
  const { classes } = useClasses()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    paymentMethod: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchPaymentHistory()
  }, [filters])

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)
      const res = await feesAPI.getPaymentHistory(filters)
      setPayments(res.data.payments)
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch payment history' })
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethodBadge = (method) => {
    const config = {
      CASH: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-600/10' },
      BANK: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-600/10' },
      ONLINE: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/10' },
    }
    const c = config[method] || config.CASH
    return (
      <span className={`inline-flex items-center rounded-md ${c.bg} ${c.text} ring-1 ring-inset ${c.ring} px-2 py-0.5 text-xs font-medium`}>
        {method}
      </span>
    )
  }

  const getMonthName = (month) => MONTHS.find(m => m.value === month)?.label || month

  const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const filteredPayments = payments.filter(p => {
    if (filters.paymentMethod && p.paymentMethod !== filters.paymentMethod) return false
    return true
  })

  return (
    <div className="space-y-4">
      <PagePanel
        icon={CreditCard}
        title="Payment History"
        count={filteredPayments.length}
        countLabel="payments"
      >
        <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <Select value={filters.month ? String(filters.month) : "all"}
            onValueChange={(value) => setFilters({ ...filters, month: value === "all" ? '' : parseInt(value) })}>
            <SelectTrigger className="w-full sm:w-35">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.year ? String(filters.year) : "all"}
            onValueChange={(value) => setFilters({ ...filters, year: value === "all" ? '' : parseInt(value) })}>
            <SelectTrigger className="w-full sm:w-35">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.paymentMethod || "all"}
            onValueChange={(value) => setFilters({ ...filters, paymentMethod: value === "all" ? '' : value })}>
            <SelectTrigger className="col-span-2 w-full sm:col-span-1 sm:w-35">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Loading payment history...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Student</TableHead>
                <TableHead className="font-semibold">Class</TableHead>
                <TableHead className="font-semibold">Challan #</TableHead>
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold text-right">Amount</TableHead>
                <TableHead className="font-semibold">Method</TableHead>
                <TableHead className="font-semibold">Received By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary flex-shrink-0">
                          {payment.challan?.student?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{payment.challan?.student?.name}</p>
                          <p className="text-xs text-muted-foreground">{payment.challan?.student?.rollNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/10 px-2 py-0.5 text-xs font-medium">
                        {payment.challan?.student?.enrollment?.class?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                        {payment.challan?.challanNumber}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getMonthName(payment.challan?.month)} {payment.challan?.year}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-sm tabular-nums">
                      Rs. {Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payment.receivedByUser?.admin?.name || payment.receivedByUser?.email}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-muted p-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No payments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </PagePanel>
    </div>
  )
}
