import {useEffect, useState} from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Table, TableBody, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import useAppForm from '@/hooks/useAppForm'
import {classesAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {useClasses} from '@/hooks/useClasses'
import {BookOpen, GraduationCap, Loader2, School, Search, Tag, Users,} from 'lucide-react'
import {ActionButtons, PagePanel, TableEmpty, TableSpinner} from '@/components/shared/admin-table'

// ── Options ──────────────────────────────────────────────────────────────────
const GRADE_LEVEL_OPTIONS = [
    {value: 'GRADE_11', label: 'Grade 11'},
    {value: 'GRADE_12', label: 'Grade 12'},
]

const PROGRAM_OPTIONS = [
    {value: 'MED', label: 'Pre-Medical'},
    {value: 'ENG', label: 'Pre-Engineering'},
    {value: 'ICS', label: 'ICS'},
    {value: 'IT', label: 'IT'},
    {value: 'FA', label: 'F.A'},
]

const GRADE_LEVEL_LABELS = Object.fromEntries(GRADE_LEVEL_OPTIONS.map(o => [o.value, o.label]))
const PROGRAM_LABELS = Object.fromEntries(PROGRAM_OPTIONS.map(o => [o.value, o.label]))

// ── Yup schema ────────────────────────────────────────────────────────────────
const classSchema = Yup.object({
    name: Yup.string().trim().required('Class name is required'),
    gradeLevel: Yup.string().required('Grade level is required'),
    program: Yup.string().required('Program is required'),
    monthlyFee: Yup.number()
        .typeError('Fee must be a number')
        .min(0, 'Fee cannot be negative'),
    studentLimit: Yup.number()
        .typeError('Must be a number')
        .min(1, 'At least 1 student required')
        .required('Student limit is required'),
})

const EMPTY_VALUES = {
    name: '',
    gradeLevel: 'GRADE_11',
    program: 'ICS',
    monthlyFee: '',
    studentLimit: 35,
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminClasses() {
    const {refreshClasses: refreshGlobalClasses} = useClasses()
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingClass, setEditingClass] = useState(null)
    const [search, setSearch] = useState('')
    const [filterProgram, setFilterProgram] = useState('all')
    const {toast} = useToast()

    // ── useAppForm ───────────────────────────────────────────────────────────────
    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues: EMPTY_VALUES,
        validationSchema: classSchema,
        onSubmit: async (values) => {
            if (editingClass) {
                await classesAPI.update(editingClass.id, {
                    name: values.name,
                    gradeLevel: values.gradeLevel,
                    program: values.program,
                    monthlyFee: values.monthlyFee,
                    studentLimit: values.studentLimit,
                })
                return 'edit'
            } else {
                await classesAPI.create({...values})
                return 'create'
            }
        },
        onSuccess: (mode) => {
            toast({
                title: 'Success',
                description: mode === 'edit' ? 'Class updated successfully' : 'Class created successfully',
            })
            setDialogOpen(false)
            fetchClasses()
            refreshGlobalClasses()
        },
    })

    // ── Reset form when dialog opens ─────────────────────────────────────────────
    useEffect(() => {
        if (!dialogOpen) return
        const values = editingClass
            ? {
                name: editingClass.name,
                gradeLevel: editingClass.gradeLevel || 'GRADE_11',
                program: editingClass.program || 'ICS',
                monthlyFee: editingClass.monthlyFee?.toString() || '',
                studentLimit: editingClass.studentLimit || 35,
            }
            : EMPTY_VALUES
        formik.resetForm({values})
        clearServerError()
    }, [dialogOpen]) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Data fetching ────────────────────────────────────────────────────────────
    useEffect(() => {
        fetchClasses()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClasses()
        }, 300)
        return () => clearTimeout(timer)
    }, [search, filterProgram])

    const fetchClasses = async () => {
        try {
            const params = {}
            if (search) params.search = search
            if (filterProgram && filterProgram !== 'all') params.program = filterProgram
            const response = await classesAPI.getAll(params)
            setClasses(response.data.classes)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch classes'})
        } finally {
            setLoading(false)
        }
    }

    const handleOpenDialog = (cls = null) => {
        setEditingClass(cls)
        setDialogOpen(true)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this class?')) return
        try {
            await classesAPI.delete(id)
            toast({title: 'Success', description: 'Class deleted successfully'})
            fetchClasses()
            refreshGlobalClasses()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete class',
            })
        }
    }

    // ── Render ───────────────────────────────────────────────────────────────────
    return (
        <DashboardLayout title="Class Management">
            <div className="space-y-6">
                <PagePanel
                    icon={School}
                    iconBg="bg-primary-500/10 dark:bg-primary-500/15"
                    iconColor="text-primary-600 dark:text-primary-400"
                    title="Classes"
                    count={classes.length}
                    countLabel="total classes"
                    addLabel="Add Class"
                    onAdd={() => handleOpenDialog()}
                >
                    {/* Filters */}
                    <div className="w-full flex flex-row justify-between mb-6 gap-3 flex-wrap">
                        <div className="w-full  xs:w-35">
                            <Select value={filterProgram} onValueChange={setFilterProgram}>
                                <SelectTrigger className="">
                                    <SelectValue placeholder="All Programs"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Programs</SelectItem>
                                    {PROGRAM_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full  xs:w-35 relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-500 pointer-events-none"/>
                            <Input
                                placeholder="Search Class"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <TableSpinner label="Loading classes..."/>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Class Name</TableHead>
                                    <TableHead>Grade Level</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead>Monthly Fee (PKR)</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {classes.map((cls) => (
                                    <TableRow key={cls.id}>
                                        <td className="px-4 py-3 align-middle font-medium">
                                            <div className="flex flex-col">
                                                <strong
                                                    className="text-lg text-gray-800 dark:text-dark-100">{cls.name}</strong>
                                                <span
                                                    className="text-[9px] text-gray-400 dark:text-dark-500">{PROGRAM_LABELS[cls.program] || cls.program}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">{GRADE_LEVEL_LABELS[cls.gradeLevel] || cls.gradeLevel}</td>
                                        <td className="px-4 py-3 align-middle">
                      <span
                          className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-dark-200 px-2 py-0.5 text-xs font-medium">
                        <Users className="h-3 w-3 text-gray-400 dark:text-dark-500"/>
                          {cls._count?.students || 0}/{cls.studentLimit || 35}
                      </span>
                                        </td>
                                        <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">{cls.monthlyFee}</td>
                                        <td className="px-4 py-3 align-middle">
                                            <ActionButtons
                                                onEdit={() => handleOpenDialog(cls)}
                                                onDelete={() => handleDelete(cls.id)}
                                            />
                                        </td>
                                    </TableRow>
                                ))}
                                {classes.length === 0 && (
                                    <TableEmpty icon={School} label="No classes found" colSpan={5}/>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </PagePanel>
            </div>

            {/* ── Add / Edit Class Dialog ── */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-dark-900">
                    <DialogHeader>
                        <DialogTitle className="text-lg">
                            {editingClass ? 'Edit Class' : 'Add New Class'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={formik.handleSubmit} className="space-y-4 pt-1">
                        <ServerError message={serverError} onDismiss={clearServerError}/>

                        <FormField
                            label="Class Name"
                            name="name"
                            icon={<Tag className="h-4 w-4"/>}
                            placeholder="e.g., Class 1, Class 2"
                            value={formik.values.name}
                            error={formik.touched.name && formik.errors.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />

                        <div className="flex flex-wrap gap-3">
                            <div className="min-w-32 flex-1">
                                <FormSelect
                                    label="Grade Level"
                                    name="gradeLevel"
                                    icon={<GraduationCap className="h-4 w-4"/>}
                                    value={formik.values.gradeLevel}
                                    error={formik.touched.gradeLevel && formik.errors.gradeLevel}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    required
                                    options={GRADE_LEVEL_OPTIONS}
                                />
                            </div>

                            <div className="min-w-32 flex-1">
                                <FormSelect
                                    label="Program"
                                    name="program"
                                    icon={<BookOpen className="h-4 w-4"/>}
                                    value={formik.values.program}
                                    error={formik.touched.program && formik.errors.program}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    required
                                    options={PROGRAM_OPTIONS}
                                />
                            </div>

                            {/*{isMorning && (*/}
                            {/*    <div className="min-w-24 flex-1">*/}
                            {/*        <FormField*/}
                            {/*            label="Fee Per Month"*/}
                            {/*            name="monthlyFee"*/}
                            {/*            type="number"*/}
                            {/*            icon={<DollarSign className="h-4 w-4"/>}*/}
                            {/*            placeholder="e.g., 5000"*/}
                            {/*            value={formik.values.monthlyFee}*/}
                            {/*            error={formik.touched.monthlyFee && formik.errors.monthlyFee}*/}
                            {/*            onChange={formik.handleChange}*/}
                            {/*            onBlur={formik.handleBlur}*/}
                            {/*        />*/}
                            {/*    </div>*/}
                            {/*)}*/}

                            {/*<div className="min-w-24 flex-1">*/}
                            {/*    <FormField*/}
                            {/*        label="Student Limit"*/}
                            {/*        name="studentLimit"*/}
                            {/*        type="number"*/}
                            {/*        icon={<Users className="h-4 w-4"/>}*/}
                            {/*        placeholder="Default: 35"*/}
                            {/*        value={formik.values.studentLimit}*/}
                            {/*        error={formik.touched.studentLimit && formik.errors.studentLimit}*/}
                            {/*        onChange={formik.handleChange}*/}
                            {/*        onBlur={formik.handleBlur}*/}
                            {/*        required*/}
                            {/*    />*/}
                            {/*</div>*/}
                        </div>

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
                                {editingClass ? 'Update' : 'Create'} Class
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
