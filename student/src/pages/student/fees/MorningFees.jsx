import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {morningFeesAPI, paymentInfoAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {AlertCircle, Building2, CheckCircle, Clock, CreditCard, Download, Printer, Receipt, Wallet,} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";
import {INSTITUTE_NAME} from '@shared/config/institute'

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

export default function MorningFees() {
    const [challans, setChallans] = useState([])
    const [arrears, setArrears] = useState(0)
    const [loading, setLoading] = useState(true)
    const [paymentInfo, setPaymentInfo] = useState([])
    const {toast} = useToast()

    useEffect(() => {
        fetchChallans()
        fetchPaymentInfo()
    }, [])

    const fetchChallans = async () => {
        try {
            const res = await morningFeesAPI.getMyChallans()
            setChallans(res.data.challans)
            setArrears(res.data.arrears || 0)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch challans',
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchPaymentInfo = async () => {
        try {
            const res = await paymentInfoAPI.getAll()
            setPaymentInfo(res.data.paymentInfo || [])
        } catch {
            // Non-critical — the fees page still works without payment info
        }
    }

    const getMonthName = (month) => {
        return MONTHS.find(m => m.value === month)?.label || month
    }

    const getStatusBadge = (status) => {
        const config = {
            UNPAID: {bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500'},
            PAID: {bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500'},
            PARTIAL: {bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500'},
            OVERDUE: {bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500'},
        }
        const c = config[status] || config.UNPAID
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}/>
                {status}
      </span>
        )
    }

    const printChallan = (challan) => {
        const printWindow = window.open('', '_blank')
        const bankDetailsHtml = paymentInfo.length > 0
            ? paymentInfo.map(p => `
              <p><strong>Account Title:</strong> ${p.accountTitle}</p>
              <p><strong>Account Number:</strong> ${p.accountNumber}</p>
              <p><strong>Bank Name:</strong> ${p.bankName}</p>
              ${p.notes ? `<p><em>${p.notes}</em></p>` : ''}
            `).join('<hr style="border: none; border-top: 1px dashed #fde68a; margin: 12px 0;">')
            : '<p>Contact the administration for payment details.</p>'
        const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fee Challan - ${challan.challanNumber}</title>
        <style>
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a2e; }
          .header { text-align: center; border-bottom: 3px solid #1a3a6b; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1a3a6b; margin: 0; font-size: 28px; }
          .header p { margin: 5px 0 0; color: #666; font-size: 15px; }
          .challan-info { display: flex; justify-content: space-between; margin-bottom: 24px; }
          .student-info { background: #f8f9fb; padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #e8ecf2; }
          .fee-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #e8ecf2; }
          .fee-table th, .fee-table td { padding: 12px 16px; text-align: left; }
          .fee-table th { background: #f8f9fb; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
          .fee-table td { border-top: 1px solid #e8ecf2; }
          .total-row { font-weight: 700; background: #eef2ff; }
          .bank-details { background: #fffbeb; padding: 20px; border-radius: 12px; margin-top: 24px; border: 1px solid #fde68a; }
          .bank-details h3 { margin-top: 0; color: #92400e; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${INSTITUTE_NAME}</h1>
          <p>Morning Batch - Fee Challan</p>
        </div>
        <div class="challan-info">
          <div>
            <strong>Challan No:</strong> ${challan.challanNumber}<br>
            <strong>Issue Date:</strong> ${new Date(challan.issueDate).toLocaleDateString()}<br>
            <strong>Due Date:</strong> ${new Date(challan.dueDate).toLocaleDateString()}
          </div>
          <div style="text-align: right;">
            <strong>Month:</strong> ${getMonthName(challan.month)} ${challan.year}<br>
            <strong>Status:</strong> ${challan.status}
          </div>
        </div>
        <div class="student-info">
          <strong>Student Name:</strong> ${challan.student?.name}<br>
          <strong>Roll Number:</strong> ${challan.student?.rollNumber}<br>
          <strong>Class:</strong> ${challan.student?.class?.name || challan.student?.enrollments?.[0]?.class?.name || 'N/A'}<br>
          <strong>Father's Name:</strong> ${challan.student?.fatherName}
        </div>
        <table class="fee-table">
          <thead><tr><th>Description</th><th style="text-align: right;">Amount (Rs.)</th></tr></thead>
          <tbody>
            <tr><td>Monthly Tuition Fee</td><td style="text-align: right;">${Number(challan.monthlyFee).toLocaleString()}</td></tr>
            ${Number(challan.arrears) > 0 ? `<tr><td>Previous Arrears</td><td style="text-align: right;">${Number(challan.arrears).toLocaleString()}</td></tr>` : ''}
            ${Number(challan.lateFee) > 0 ? `<tr><td>Late Fee</td><td style="text-align: right;">${Number(challan.lateFee).toLocaleString()}</td></tr>` : ''}
            ${Number(challan.discount) > 0 ? `<tr><td>Discount</td><td style="text-align: right;">-${Number(challan.discount).toLocaleString()}</td></tr>` : ''}
            <tr class="total-row"><td>Total Payable</td><td style="text-align: right;">${Number(challan.totalAmount).toLocaleString()}</td></tr>
            ${Number(challan.paidAmount) > 0 ? `
            <tr><td>Amount Paid</td><td style="text-align: right;">${Number(challan.paidAmount).toLocaleString()}</td></tr>
            <tr class="total-row"><td>Balance Due</td><td style="text-align: right;">${(Number(challan.totalAmount) - Number(challan.paidAmount)).toLocaleString()}</td></tr>` : ''}
          </tbody>
        </table>
        <div class="bank-details">
          <h3>Online Payment Details</h3>
          ${bankDetailsHtml}
          <p style="margin-bottom: 0;"><em>Please mention challan number in payment reference</em></p>
        </div>
        <div class="footer">
          <p>For queries, contact the administration office</p>
          <p>Late fee of Rs. 500 will be charged after due date</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `
        printWindow.document.write(content)
        printWindow.document.close()
    }

    const handleDownloadPDF = async (challan) => {
        try {
            const res = await morningFeesAPI.downloadPDF(challan.id)
            const blob = new Blob([res.data], {type: 'application/pdf'})
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `challan-${challan.challanNumber}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to download PDF',
            })
        }
    }

    const summary = {
        // Exclude ROLLED_OVER challans — their outstanding balance has been carried
        // into a newer challan as arrears, so counting them here double-counts the due.
        totalDue: challans.filter(c => c.status !== 'PAID' && c.status !== 'ROLLED_OVER').reduce((sum, c) => sum + (Number(c.totalAmount) - Number(c.paidAmount)), 0),
        totalPaid: challans.reduce((sum, c) => sum + Number(c.paidAmount), 0),
        unpaidCount: challans.filter(c => c.status === 'UNPAID' || c.status === 'OVERDUE').length,
        paidCount: challans.filter(c => c.status === 'PAID').length,
    }

    return (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card className="relative overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Challans</p>
                                <p className="text-3xl font-bold mt-1">{challans.length}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Receipt className="h-6 w-6 text-primary"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 to-primary/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                                <p className="text-2xl font-bold mt-1 text-rose-600">Rs. {summary.totalDue.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                <AlertCircle className="h-6 w-6 text-rose-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/80 to-rose-500/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-600">Rs. {summary.totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="h-6 w-6 text-emerald-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/80 to-emerald-500/20"/>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Unpaid Challans</p>
                                <p className="text-3xl font-bold mt-1">{summary.unpaidCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-amber-600"/>
                            </div>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/80 to-amber-500/20"/>
                    </CardContent>
                </Card>
            </div>

      {/* Arrears Warning */}
      {arrears > 0 && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50/50 flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-rose-600"/>
              </div>
              <div>
                  <p className="font-semibold text-rose-800 text-sm">Outstanding Arrears</p>
                  <p className="text-sm text-rose-700 mt-0.5">
                      You have outstanding arrears of <span className="font-bold">Rs. {arrears.toLocaleString()}</span>.
                      Please clear your dues to avoid late fee charges.
                  </p>
              </div>
          </div>
      )}

      {/* Challans Table */}
            <PagePanel
                icon={Wallet}
                title={'Fee Challan'}
                countLabel={'View and download your fee challans'}
            >
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 animate-pulse">
                                <div className="h-4 w-20 bg-muted rounded"/>
                                <div className="h-4 w-24 bg-muted rounded"/>
                                <div className="h-4 w-20 bg-muted rounded"/>
                                <div className="h-4 w-16 bg-muted rounded"/>
                                <div className="h-4 w-16 bg-muted rounded"/>
                                <div className="h-4 w-20 bg-muted rounded"/>
                                <div className="h-6 w-16 bg-muted rounded-full"/>
                                <div className="ml-auto h-8 w-20 bg-muted rounded"/>
                            </div>
                        ))}
                    </div>
                ) : challans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                            <Receipt className="h-8 w-8 text-muted-foreground/60"/>
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No challans found</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Fee challans will appear here once they are generated by the administration.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                                <TableHead className="font-semibold">Challan #</TableHead>
                                <TableHead className="font-semibold">Month</TableHead>
                                <TableHead className="font-semibold">Due Date</TableHead>
                                <TableHead className="font-semibold text-right">Fee</TableHead>
                                <TableHead className="font-semibold text-right">Arrears</TableHead>
                                <TableHead className="font-semibold text-right">Total</TableHead>
                                <TableHead className="font-semibold text-right">Paid</TableHead>
                                <TableHead className="font-semibold text-right">Balance</TableHead>
                                <TableHead className="font-semibold text-center">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {challans.map((challan, index) => {
                                // A rolled-over challan no longer carries a due here — its balance
                                // moved into a newer challan's arrears.
                                const balance = challan.status === 'ROLLED_OVER'
                                    ? 0
                                    : Number(challan.totalAmount) - Number(challan.paidAmount)
                                return (
                                    <TableRow key={challan.id}
                                              className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                        <TableCell className="font-mono text-sm">{challan.challanNumber}</TableCell>
                                        <TableCell
                                            className="text-sm">{getMonthName(challan.month)} {challan.year}</TableCell>
                                        <TableCell
                                            className="text-sm">{new Date(challan.dueDate).toLocaleDateString()}</TableCell>
                                        <TableCell
                                            className="text-right font-mono text-sm">Rs. {Number(challan.monthlyFee).toLocaleString()}</TableCell>
                                        <TableCell
                                            className="text-right font-mono text-sm">Rs. {Number(challan.arrears).toLocaleString()}</TableCell>
                                        <TableCell
                                            className="text-right font-mono text-sm font-semibold">Rs. {Number(challan.totalAmount).toLocaleString()}</TableCell>
                                        <TableCell
                                            className="text-right font-mono text-sm">Rs. {Number(challan.paidAmount).toLocaleString()}</TableCell>
                                        <TableCell
                                            className={`text-right font-mono text-sm font-semibold ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            Rs. {balance.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-center">{getStatusBadge(challan.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDownloadPDF(challan)}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Download className="h-3.5 w-3.5"/>
                                                    PDF
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => printChallan(challan)}
                                                >
                                                    <Printer className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* Bank Details Card */}
            {paymentInfo.length > 0 && (
                <Card className="mt-6">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <Building2 className="h-4 w-4 text-amber-600"/>
                            </div>
                            Payment Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {paymentInfo.map((info) => (
                            <div key={info.id} className="p-5 bg-amber-50/50 rounded-xl border border-amber-200/60">
                                <h4 className="font-semibold text-sm text-amber-900 mb-4 flex items-center gap-2">
                                    <CreditCard className="h-4 w-4"/>
                                    {info.bankName}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-amber-700/70 uppercase tracking-wider">Account
                                            Title</p>
                                        <p className="font-semibold text-sm text-amber-900">{info.accountTitle}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-amber-700/70 uppercase tracking-wider">Account
                                            Number / IBAN</p>
                                        <p className="font-semibold text-sm font-mono text-amber-900">{info.accountNumber}</p>
                                    </div>
                                </div>
                                {info.notes && (
                                    <p className="text-xs text-amber-700 mt-4 pt-4 border-t border-amber-200/60">
                                        {info.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </>
    )
}
