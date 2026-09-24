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
import {useAuth} from '@/context/AuthContext'
import {BookOpen, GraduationCap, Loader2, School, Search, Tag, Users, ArrowUpRight, Award,} from 'lucide-react'
import {ActionButtons, PagePanel, TableEmpty, TableSpinner} from '@/components/shared/admin-table'
import ConfirmPhraseDialog from '@/components/shared/ConfirmPhraseDialog'

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
    studentLimit: Yup.number()
        .typeError('Must be a number')
        .min(1, 'At least 1 student required')
        .required('Student limit is required'),
})

// Typed-phrase confirmations, matched server-side. Kept verbatim here so the
// prompt the admin reads is the string that actually has to reach the API.
const CONFIRM_PROMOTE = 'PROMOTE'
const CONFIRM_PASS_OUT = 'PASSOUT'

// Pull the API's message out of the { errors: { ... } } envelope. Field-keyed
// errors (targetClassId, confirm) read just as well as a banner here.
const apiError = (error, fallback) => {
    const errors = error.response?.data?.errors
    if (!errors) return fallback
    return errors.message || Object.values(errors)[0] || fallback
}

const EMPTY_VALUES = {
    name: '',
    gradeLevel: 'GRADE_11',
    program: 'ICS',
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
    const {hasPermission} = useAuth()

    // Both actions rewrite a whole cohort, so they need class *and* student
    // rights — the same AND the routes enforce.
    const canMoveCohort = hasPermission('classes.edit') && hasPermission('students.edit')

    const [promote, setPromote] = useState({open: false, cls: null, loading: false, targets: [], targetId: '', sourceCount: 0, occupied: 0, loadError: null, error: null, submitting: false})
    const [passOut, setPassOut] = useState({open: false, cls: null, error: null, submitting: false})

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

    // ── Promote a Grade 11 cohort into an empty Grade 12 class ──────────────────
    const openPromote = async (cls) => {
        setPromote({open: true, cls, loading: true, targets: [], targetId: '', sourceCount: 0, occupied: 0, loadError: null, error: null, submitting: false})
        try {
            const {data} = await classesAPI.getPromotionTargets(cls.id)
            setPromote(p => ({
                ...p,
                loading: false,
                targets: data.targets,
                // One eligible class is the common case — preselect it so the
                // admin only has the confirmation left to do.
                targetId: data.targets.length === 1 ? String(data.targets[0].id) : '',
                sourceCount: data.sourceClass.studentCount,
                occupied: data.occupiedCount,
            }))
        } catch (error) {
            // Nothing can be confirmed if we don't know the targets, so this
            // blocks the dialog rather than sitting above a dead form.
            setPromote(p => ({...p, loading: false, loadError: apiError(error, 'Could not load the Grade 12 classes. Try again.')}))
        }
    }

    const submitPromote = async () => {
        setPromote(p => ({...p, submitting: true, error: null}))
        try {
            const {data} = await classesAPI.promote(promote.cls.id, {
                targetClassId: Number(promote.targetId),
                confirm: CONFIRM_PROMOTE,
            })
            toast({title: 'Class promoted', description: data.message})
            setPromote(p => ({...p, open: false, submitting: false}))
            fetchClasses()
            refreshGlobalClasses()
        } catch (error) {
            setPromote(p => ({...p, submitting: false, error: apiError(error, 'Failed to promote this class.')}))
        }
    }

    // ── Pass a Grade 12 cohort out ──────────────────────────────────────────────
    const openPassOut = (cls) => setPassOut({open: true, cls, error: null, submitting: false})

    const submitPassOut = async () => {
        setPassOut(g => ({...g, submitting: true, error: null}))
        try {
            const {data} = await classesAPI.passOut(passOut.cls.id, {confirm: CONFIRM_PASS_OUT})
            toast({title: 'Class passed out', description: data.message})
            setPassOut(g => ({...g, open: false, submitting: false}))
            fetchClasses()
            refreshGlobalClasses()
        } catch (error) {
            setPassOut(g => ({...g, submitting: false, error: apiError(error, 'Failed to pass this class out.')}))
        }
    }

    // Why the promote dialog can't go ahead, if it can't. Order matters: an
    // empty source class is the admin's own mistake, no free Grade 12 class is
    // a prerequisite they have to go and satisfy elsewhere.
    const promoteBlockedReason = () => {
        if (!promote.cls || promote.loading) return null
        if (promote.loadError) return promote.loadError
        if (promote.sourceCount === 0) {
            return `${promote.cls?.name} has no active students to promote.`
        }
        if (promote.targets.length === 0) {
            const program = PROGRAM_LABELS[promote.cls?.program] || promote.cls?.program
            return promote.occupied > 0
                ? `Every Grade 12 ${program} class already has students in it. Pass one of them out first — that frees it up to receive this class.`
                : `There is no Grade 12 ${program} class to promote into. Create one first, or pass an existing one out to free it up.`
        }
        return null
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
                description: apiError(error, 'Failed to delete class'),
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
                                        <td className="px-4 py-3 align-middle">
                                            <ActionButtons
                                                menuWidth="w-48"
                                                extra={canMoveCohort ? ({close}) => (
                                                    cls.gradeLevel === 'GRADE_11' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => { close(); openPromote(cls) }}
                                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                                                        >
                                                            <ArrowUpRight className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
                                                            Promote to Grade 12
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => { close(); openPassOut(cls) }}
                                                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                                                        >
                                                            <Award className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
                                                            Mark as passed out
                                                        </button>
                                                    )
                                                ) : null}
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
            {/* ── Promote to Grade 12 ── */}
            <ConfirmPhraseDialog
                open={promote.open}
                onOpenChange={(open) => setPromote(p => ({...p, open}))}
                title={`Promote ${promote.cls?.name || ''} to Grade 12`}
                description={
                    promote.loading
                        ? 'Checking which Grade 12 classes are free…'
                        : `Every active student moves across with their roll number, fee and full history intact. Their subject enrollments are cleared, because Grade 11 subjects don't carry over — assign Grade 12 subjects afterwards.`
                }
                phrase={CONFIRM_PROMOTE}
                actionLabel="Promote class"
                loading={promote.submitting || promote.loading}
                canConfirm={Boolean(promote.targetId)}
                blocked={promoteBlockedReason()}
                error={promote.error}
                onDismissError={() => setPromote(p => ({...p, error: null}))}
                onConfirm={submitPromote}
            >
                {promote.loading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-dark-500 py-2">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        Loading…
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        <label className="block text-sm text-gray-600 dark:text-dark-300">
                            Promote {promote.sourceCount} student{promote.sourceCount === 1 ? '' : 's'} into
                        </label>
                        <Select
                            value={promote.targetId}
                            onValueChange={(val) => setPromote(p => ({...p, targetId: val}))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a Grade 12 class"/>
                            </SelectTrigger>
                            <SelectContent>
                                {promote.targets.map(t => (
                                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400 dark:text-dark-500">
                            Only empty Grade 12 classes of the same program can receive a cohort.
                        </p>
                    </div>
                )}
            </ConfirmPhraseDialog>

            {/* ── Pass a Grade 12 class out ── */}
            <ConfirmPhraseDialog
                open={passOut.open}
                onOpenChange={(open) => setPassOut(g => ({...g, open}))}
                title={`Pass out ${passOut.cls?.name || ''}`}
                description={`All ${passOut.cls?._count?.students ?? 0} active student${passOut.cls?._count?.students === 1 ? '' : 's'} in ${passOut.cls?.name || 'this class'} will be marked as passed out. Their records stay in full, but they stop counting as active students and can no longer sign in to the student portal. ${passOut.cls?.name || 'The class'} is then free to receive a Grade 11 class.`}
                phrase={CONFIRM_PASS_OUT}
                actionLabel="Pass class out"
                destructive
                loading={passOut.submitting}
                blocked={passOut.cls && (passOut.cls._count?.students ?? 0) === 0
                    ? `${passOut.cls.name} has no active students to pass out.`
                    : null}
                error={passOut.error}
                onDismissError={() => setPassOut(g => ({...g, error: null}))}
                onConfirm={submitPassOut}
            />
        </DashboardLayout>
    )
}
