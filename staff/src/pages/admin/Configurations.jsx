import {useEffect, useState} from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Table, TableBody, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {FormField, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {paymentInfoAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {Banknote, CreditCard, Hash, Landmark, Loader2, StickyNote} from 'lucide-react'
import {ActionButtons, PagePanel, TableEmpty, TableSpinner} from '@/components/shared/admin-table'

// ── Yup schema ────────────────────────────────────────────────────────────────
const paymentInfoSchema = Yup.object({
    bankName: Yup.string().trim().required('Bank name is required'),
    accountTitle: Yup.string().trim().required('Account title is required'),
    accountNumber: Yup.string().trim().required('Account number is required'),
    notes: Yup.string().trim(),
})

const EMPTY_VALUES = {
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    notes: '',
}

// ── Payment Info tab ─────────────────────────────────────────────────────────

function PaymentInfoTab() {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingRow, setEditingRow] = useState(null)
    const {toast} = useToast()

    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues: EMPTY_VALUES,
        validationSchema: paymentInfoSchema,
        onSubmit: async (values) => {
            if (editingRow) {
                await paymentInfoAPI.update(editingRow.id, values)
                return 'edit'
            } else {
                await paymentInfoAPI.create(values)
                return 'create'
            }
        },
        onSuccess: (mode) => {
            toast({
                title: 'Success',
                description: mode === 'edit' ? 'Payment info updated successfully' : 'Payment info created successfully',
            })
            setDialogOpen(false)
            fetchRows()
        },
    })

    useEffect(() => {
        if (!dialogOpen) return
        const values = editingRow
            ? {
                bankName: editingRow.bankName || '',
                accountTitle: editingRow.accountTitle || '',
                accountNumber: editingRow.accountNumber || '',
                notes: editingRow.notes || '',
            }
            : EMPTY_VALUES
        formik.resetForm({values})
        clearServerError()
    }, [dialogOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchRows()
    }, [])

    const fetchRows = async () => {
        setLoading(true)
        try {
            const response = await paymentInfoAPI.getAll()
            setRows(response.data.paymentInfo)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch payment info'})
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (row = null) => {
        setEditingRow(row)
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment info entry?')) return
        try {
            await paymentInfoAPI.delete(id)
            toast({title: 'Success', description: 'Payment info deleted successfully'})
            fetchRows()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete payment info',
            })
        }
    }

    return (
        <>
            <PagePanel
                icon={Banknote}
                title="Payment Info"
                count={rows.length}
                countLabel="total entries"
                addLabel="Add Payment Info"
                onAdd={() => handleOpenDialog()}
            >
                {loading ? (
                    <TableSpinner label="Loading payment info..."/>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bank Name</TableHead>
                                <TableHead>Account Title</TableHead>
                                <TableHead>Account Number / IBAN</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((row) => (
                                <TableRow key={row.id}>
                                    <td className="px-4 py-3 align-middle font-medium text-gray-800 dark:text-dark-100">{row.bankName}</td>
                                    <td className="px-4 py-3 align-middle text-gray-600 dark:text-dark-300">{row.accountTitle}</td>
                                    <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400 font-mono text-sm">{row.accountNumber}</td>
                                    <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400 max-w-xs truncate">{row.notes || '—'}</td>
                                    <td className="px-4 py-3 align-middle">
                                        <ActionButtons
                                            onEdit={() => handleOpenDialog(row)}
                                            onDelete={() => handleDelete(row.id)}
                                        />
                                    </td>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableEmpty icon={Banknote} label="No payment info found" colSpan={5}/>
                            )}
                        </TableBody>
                    </Table>
                )}
            </PagePanel>

            {/* ── Add / Edit Payment Info Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-dark-900">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {editingRow ? 'Edit Payment Info' : 'Add Payment Info'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={formik.handleSubmit} className="space-y-4 pt-1">
                        <ServerError message={serverError} onDismiss={clearServerError}/>

                        <FormField
                            label="Bank Name"
                            name="bankName"
                            icon={<Landmark className="h-4 w-4"/>}
                            placeholder="e.g., HBL - Main Branch"
                            value={formik.values.bankName}
                            error={formik.touched.bankName && formik.errors.bankName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />

                        <FormField
                            label="Account Title"
                            name="accountTitle"
                            icon={<CreditCard className="h-4 w-4"/>}
                            placeholder="Name on the account"
                            value={formik.values.accountTitle}
                            error={formik.touched.accountTitle && formik.errors.accountTitle}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />

                        <FormField
                            label="Account Number / IBAN"
                            name="accountNumber"
                            icon={<Hash className="h-4 w-4"/>}
                            placeholder="e.g., PK00XXXX0000000000000000"
                            value={formik.values.accountNumber}
                            error={formik.touched.accountNumber && formik.errors.accountNumber}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />

                        <FormField
                            label="Notes / Instructions"
                            name="notes"
                            icon={<StickyNote className="h-4 w-4"/>}
                            placeholder="Optional, e.g. Pay before due date"
                            value={formik.values.notes}
                            error={formik.touched.notes && formik.errors.notes}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {editingRow ? 'Update' : 'Create'} Payment Info
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Configurations() {
    return (
        <DashboardLayout title="Configurations">
            <div className="space-y-6">
                <Tabs defaultValue="payment-info">
                    <TabsList>
                        <TabsTrigger value="payment-info" className="gap-2">
                            <Banknote className="h-4 w-4"/>
                            Payment Info
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="payment-info">
                        <PaymentInfoTab/>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}
