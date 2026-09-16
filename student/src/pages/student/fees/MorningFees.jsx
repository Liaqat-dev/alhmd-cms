import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {morningFeesAPI, paymentInfoAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {AlertCircle, Building2, CheckCircle, Clock, CreditCard, Download, Printer, Receipt, Wallet,} from 'lucide-react'
import {PagePanel} from "@/components/shared/admin-table.jsx";
import {INSTITUTE_NAME, INSTITUTE_TAG} from '@shared/config/institute'
import logo from '@/images/logo.png'

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

        const admissionFeeTotal = (challan.expenses || [])
            .filter(e => e.type === 'ADMISSION_FEE')
            .reduce((s, e) => s + Number(e.amount), 0)
        const miscFeeTotal = (challan.expenses || [])
            .filter(e => e.type !== 'ADMISSION_FEE')
            .reduce((s, e) => s + Number(e.amount), 0)
        const balance = Number(challan.totalAmount) - Number(challan.paidAmount)

        const fmt = (n) => 'Rs. ' + Number(n || 0).toLocaleString('en-PK')
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : '—'

        const statusColors = {
            PAID: {text: '#16a34a', bg: '#ecfdf5'},
            UNPAID: {text: '#dc2626', bg: '#fff1f2'},
            OVERDUE: {text: '#dc2626', bg: '#fff1f2'},
            PARTIAL: {text: '#ea580c', bg: '#fffbeb'},
        }
        const sc = statusColors[challan.status] || {text: '#475569', bg: '#f1f5f9'}

        const bankRowsHtml = paymentInfo.length > 0
            ? paymentInfo.map(p => `
              <div class="bank-row"><span class="bank-label">Account Title</span><span class="bank-value">${p.accountTitle}</span></div>
              <div class="bank-row"><span class="bank-label">Account No.</span><span class="bank-value">${p.accountNumber}</span></div>
              <div class="bank-row"><span class="bank-label">Bank</span><span class="bank-value">${p.bankName}</span></div>
              ${p.notes ? `<div class="bank-row"><span class="bank-label"></span><span class="bank-value" style="font-style:italic;">${p.notes}</span></div>` : ''}
            `).join('<div class="bank-divider"></div>')
            : '<p style="font-size:12px;color:#64748b;margin:0;">Contact the administration for payment details.</p>'

        const feeRow = (label, amount, highlight) => `
            <tr${highlight ? ' style="background:#f1f5f9;"' : ''}>
              <td>${label}</td>
              <td style="text-align:right;">${fmt(amount)}</td>
            </tr>`

        const content = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8"/>
        <title>Fee Challan - ${challan.challanNumber}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; background: #fff; color: #1e293b; }
          @page { size: A4; margin: 0; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          .page { max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }

          .banner { background: #1a2744; padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; }
          .banner-left { display: flex; align-items: center; gap: 14px; }
          .banner-left img { height: 44px; width: 44px; object-fit: contain; border-radius: 50%; background: #fff; padding: 4px; }
          .banner-school { color: #fff; font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
          .banner-tag { color: #c9952b; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 2px; }
          .banner-right { text-align: right; }
          .pill { display: inline-block; background: rgba(255,255,255,0.12); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; }

          .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 32px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
          .meta-item { font-size: 12px; color: #475569; }
          .meta-item strong { color: #1a2744; font-weight: 700; }
          .status-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; color: ${sc.text}; background: ${sc.bg}; border: 1px solid ${sc.text}33; text-transform: uppercase; letter-spacing: 0.5px; }

          .date-row { display: flex; gap: 32px; padding: 12px 32px; font-size: 11.5px; color: #64748b; border-bottom: 1px solid #f1f5f9; }

          .section-header { background: #f1f5f9; padding: 8px 32px; font-size: 10.5px; font-weight: 700; letter-spacing: 1px; color: #475569; text-transform: uppercase; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; padding: 16px 32px 20px; }
          .info-field label { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
          .info-field span { font-size: 13.5px; font-weight: 700; color: #1a2744; }

          .fee-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 0 0 20px; }
          .fee-table thead th { background: #1a2744; color: #fff; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; padding: 9px 32px; text-align: left; }
          .fee-table thead th:last-child { text-align: right; }
          .fee-table tbody td { padding: 9px 32px; border-top: 1px solid #f1f5f9; color: #334155; }

          .total-bar { display: flex; justify-content: space-between; align-items: center; background: #1a2744; color: #fff; margin: 0 32px 14px; padding: 12px 16px; border-radius: 6px; }
          .total-bar .label { font-weight: 700; font-size: 13px; }
          .total-bar .value { font-weight: 800; font-size: 15px; color: #c9952b; }

          .paid-balance { padding: 0 32px 20px; }
          .pb-row { display: flex; justify-content: space-between; font-size: 12.5px; padding: 4px 0; color: #475569; }
          .pb-row .amt-paid { color: #16a34a; font-weight: 700; }
          .pb-row .amt-balance { font-weight: 700; }

          .bank-box { margin: 0 32px 20px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 18px; }
          .bank-box h4 { margin: 0 0 8px; font-size: 10.5px; font-weight: 700; color: #92400e; letter-spacing: 0.8px; text-transform: uppercase; }
          .bank-row { display: flex; gap: 10px; font-size: 12px; padding: 2px 0; }
          .bank-label { color: #92400e; opacity: 0.75; min-width: 90px; }
          .bank-value { color: #78350f; font-weight: 700; }
          .bank-divider { border-top: 1px dashed #fde68a; margin: 8px 0; }

          .remarks { padding: 0 32px 16px; font-size: 11px; color: #94a3b8; }
          .signature { display: flex; justify-content: flex-end; padding: 0 32px 24px; }
          .signature-line { border-top: 1px solid #cbd5e1; width: 180px; text-align: center; padding-top: 6px; font-size: 10.5px; color: #94a3b8; }

          .footer { text-align: center; font-size: 10px; color: #94a3b8; padding: 14px 32px 22px; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="banner">
            <div class="banner-left">
              <img src="${logo}" alt="Logo"/>
              <div>
                <div class="banner-school">${INSTITUTE_NAME}</div>
                <div class="banner-tag">${INSTITUTE_TAG}</div>
              </div>
            </div>
            <div class="banner-right">
              <span class="pill">Fee Challan</span>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-item">Challan No. <strong>${challan.challanNumber}</strong></div>
            <span class="status-badge">${challan.status}</span>
          </div>
          <div class="date-row">
            <span>Month: <strong>${getMonthName(challan.month)} ${challan.year}</strong></span>
            <span>Due: <strong>${fmtDate(challan.dueDate)}</strong></span>
            <span>Issued: <strong>${fmtDate(challan.issueDate)}</strong></span>
            ${challan.paidDate ? `<span>Paid: <strong>${fmtDate(challan.paidDate)}</strong></span>` : ''}
          </div>

          <div class="section-header">Student Information</div>
          <div class="info-grid">
            <div class="info-field"><label>Student Name</label><span>${challan.student?.name || '—'}</span></div>
            <div class="info-field"><label>Father Name</label><span>${challan.student?.fatherName || '—'}</span></div>
            <div class="info-field"><label>Roll Number</label><span>${challan.student?.rollNumber || '—'}</span></div>
            <div class="info-field"><label>Class</label><span>${challan.student?.class?.name || '—'}</span></div>
          </div>

          <div class="section-header">Fee Breakdown</div>
          <table class="fee-table">
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              ${feeRow('Monthly Tuition Fee', challan.monthlyFee, false)}
              ${admissionFeeTotal > 0 ? feeRow('Admission Fee', admissionFeeTotal, true) : ''}
              ${miscFeeTotal > 0 ? feeRow('Misc. Fee', miscFeeTotal, false) : ''}
              ${Number(challan.arrears) > 0 ? feeRow('Previous Arrears', challan.arrears, true) : ''}
              ${Number(challan.lateFee) > 0 ? feeRow('Late Fee', challan.lateFee, false) : ''}
              ${Number(challan.discount) > 0 ? feeRow('Discount', -challan.discount, true) : ''}
            </tbody>
          </table>

          <div class="total-bar">
            <span class="label">Total Payable</span>
            <span class="value">${fmt(challan.totalAmount)}</span>
          </div>

          <div class="paid-balance">
            <div class="pb-row"><span>Amount Paid</span><span class="amt-paid">${fmt(challan.paidAmount)}</span></div>
            <div class="pb-row"><span>Balance Due</span><span class="amt-balance" style="color:${balance > 0 ? '#dc2626' : '#16a34a'};">${fmt(balance)}</span></div>
          </div>

          <div class="bank-box">
            <h4>Bank Payment Details</h4>
            ${bankRowsHtml}
            <p style="margin:8px 0 0;font-size:11px;color:#92400e;font-style:italic;">Please mention challan number in payment reference</p>
          </div>

          <div class="remarks">Remarks: ${challan.remarks || '—'}</div>

          <div class="signature">
            <div class="signature-line">Authorized Signature</div>
          </div>

          <div class="footer">
            This is a computer-generated document. Late fee of Rs. 500 applies after due date.
          </div>
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
