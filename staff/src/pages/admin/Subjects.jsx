import {useEffect, useMemo, useState} from 'react'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from '@/components/ui/table'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,} from '@/components/ui/dialog'
import {subjectsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {BookOpen, GraduationCap, Layers, Loader2, Pencil, School, Trash2} from 'lucide-react'
import {useClasses} from '@/hooks/useClasses'
import useAppForm from '@/hooks/useAppForm'
import {FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import {PagePanel} from "@/components/shared/admin-table.jsx";

const GRADE_LEVEL_OPTIONS = [
    {value: 'GRADE_11', label: 'Grade 11'},
    {value: 'GRADE_12', label: 'Grade 12'},
]
const GRADE_LEVEL_LABELS = Object.fromEntries(GRADE_LEVEL_OPTIONS.map(o => [o.value, o.label]))

export default function AdminSubjects() {
    const {classes} = useClasses()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState(null)
    const [filterClass, setFilterClass] = useState('all')
    const [filterGradeLevel, setFilterGradeLevel] = useState('all')
    const {toast} = useToast()

    useEffect(() => {
        fetchSubjects()
    }, [filterClass, filterGradeLevel])

    const fetchSubjects = async () => {
        try {
            const params = {}
            if (filterClass && filterClass !== 'all') params.classId = filterClass
            if (filterGradeLevel && filterGradeLevel !== 'all') params.gradeLevel = filterGradeLevel
            const response = await subjectsAPI.getAll(params)
            setSubjects(response.data.subjects)
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to fetch subjects',
            })
        } finally {
            setLoading(false)
        }
    }

    // ── Class options for selects ────────────────────────────────────────────────
    const classOptions = classes.map(cls => ({
        value: cls.id,
        label: `${cls.name} - ${cls.gradeLevel}`,
    }))

    // ── Single subject form ──────────────────────────────────────────────────────
    const singleSchema = useMemo(() => Yup.object({
        name: Yup.string().required('Subject name is required'),
        gradeLevel: Yup.string().required('Grade level is required'),
    }), [])

    const {
        formik: singleFormik,
        isSubmitting: singleSubmitting,
        serverError: singleError,
        clearServerError: clearSingleError,
    } = useAppForm({
        initialValues: {name: '', gradeLevel: 'GRADE_11', classIds: []},
        validationSchema: singleSchema,
        onSubmit: async (values) => {
            if (editingSubject) {
                await subjectsAPI.update(editingSubject.id, values)
                return true
            } else {
                await subjectsAPI.create(values)
                return false
            }
        },
        onSuccess: (isEdit) => {
            toast({
                title: 'Success',
                description: isEdit ? 'Subject updated successfully' : 'Subject created successfully'
            })
            setDialogOpen(false)
            fetchSubjects()
        },
    })

    // Classes available for the currently selected grade level
    const classesForGradeLevel = classes.filter(c => c.gradeLevel === singleFormik.values.gradeLevel)

    const handleGradeLevelChange = (e) => {
        const gradeLevel = e.target.value
        singleFormik.setFieldValue('gradeLevel', gradeLevel)
        // Drop any selected classes that no longer belong to this grade level
        singleFormik.setFieldValue(
            'classIds',
            singleFormik.values.classIds.filter(id => classes.find(c => c.id === id)?.gradeLevel === gradeLevel)
        )
    }

    const toggleClassId = (classId) => {
        const current = singleFormik.values.classIds
        singleFormik.setFieldValue(
            'classIds',
            current.includes(classId) ? current.filter(id => id !== classId) : [...current, classId]
        )
    }

    const handleOpenDialog = (subject = null) => {
        clearSingleError()
        if (subject) {
            setEditingSubject(subject)
            singleFormik.resetForm({
                values: {
                    name: subject.name,
                    gradeLevel: subject.gradeLevel,
                    classIds: subject.classIds || (subject.classes || []).map(c => c.id),
                },
            })
        } else {
            setEditingSubject(null)
            singleFormik.resetForm({values: {name: '', gradeLevel: 'GRADE_11', classIds: []}})
        }
        setDialogOpen(true)
    }

    // ── Bulk create form ─────────────────────────────────────────────────────────
    const bulkSchema = Yup.object({
        classId: Yup.string().required('Class is required'),
        subjects: Yup.string().required('Enter at least one subject'),
    })

    const {
        formik: bulkFormik,
        isSubmitting: bulkSubmitting,
        serverError: bulkError,
        clearServerError: clearBulkError,
    } = useAppForm({
        initialValues: {classId: '', subjects: ''},
        validationSchema: bulkSchema,
        onSubmit: async (values) => {
            const subjectNames = values.subjects
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0)

            if (subjectNames.length === 0) {
                throw {response: {data: {errors: {message: 'Please enter at least one subject'}}}}
            }

            await subjectsAPI.bulkCreate({classId: values.classId, subjects: subjectNames})
            return subjectNames.length
        },
        onSuccess: (count) => {
            toast({title: 'Success', description: `${count} subjects created successfully`})
            setBulkDialogOpen(false)
            bulkFormik.resetForm({values: {classId: '', subjects: ''}})
            fetchSubjects()
        },
    })

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return
        try {
            await subjectsAPI.delete(id)
            toast({title: 'Success', description: 'Subject deleted successfully'})
            fetchSubjects()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete subject',
            })
        }
    }

    return (
        <DashboardLayout title="Subject Management">
            <div className="space-y-6">
                <PagePanel
                    icon={BookOpen}
                    title="Subjects"
                    count={subjects.length}
                    countLabel="total subjects"
                    addLabel="Add Subject"
                    onAdd={() => handleOpenDialog()}
                >
                    {/* Filters */}
                    <div className="flex gap-4 mb-6">
                        <Select value={filterGradeLevel} onValueChange={setFilterGradeLevel}>
                            <SelectTrigger className="w-full  xs:w-35">
                                <SelectValue placeholder="All Grade Levels"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Grade Levels</SelectItem>
                                {GRADE_LEVEL_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterClass} onValueChange={setFilterClass}>
                            <SelectTrigger className="w-full  xs:w-35">
                                <SelectValue placeholder="All Classes"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div
                                className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary"></div>
                            <p className="text-sm text-muted-foreground">Loading subjects...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="font-semibold">Subject Name</TableHead>
                                    <TableHead className="font-semibold">Classes</TableHead>
                                    <TableHead className="font-semibold">Students</TableHead>
                                    <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subjects.map((subject) => (
                                    <TableRow key={subject.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <BookOpen className="h-6 w-6 text-emerald-500 shrink-0"/>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{subject.name}</span>
                                                    <span className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-dark-500">
                                                        {(GRADE_LEVEL_LABELS[subject.gradeLevel] || subject.gradeLevel).toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1 max-w-[240px]">
                                                {(subject.classes || []).map(c => (
                                                    <span key={c.id}
                                                        className="inline-flex items-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10 px-2 py-0.5 text-xs font-medium">
                                                        {c.name}
                                                    </span>
                                                ))}
                                                {(subject.classes || []).length === 0 && (
                                                    <span className="text-xs text-muted-foreground">No classes yet</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                          <span
                              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {subject._count?.students || 0}
                          </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-muted"
                                                    onClick={() => handleOpenDialog(subject)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5"/>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-rose-50"
                                                    onClick={() => handleDelete(subject.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-rose-500"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {subjects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="rounded-full bg-muted p-3">
                                                    <BookOpen className="h-5 w-5 text-muted-foreground"/>
                                                </div>
                                                <p className="text-sm text-muted-foreground">No subjects found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </PagePanel>
            </div>

            {/* Single Subject Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle
                            className="text-lg">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={singleFormik.handleSubmit} className="space-y-4">
                        <ServerError message={singleError} onDismiss={clearSingleError}/>
                        <FormField
                            label="Subject Name"
                            name="name"
                            icon={<BookOpen className="h-4 w-4"/>}
                            placeholder="e.g., Mathematics, English"
                            value={singleFormik.values.name}
                            error={singleFormik.touched.name && singleFormik.errors.name}
                            onChange={singleFormik.handleChange}
                            onBlur={singleFormik.handleBlur}
                            required
                        />
                        <FormSelect
                            label="Grade Level"
                            name="gradeLevel"
                            icon={<GraduationCap className="h-4 w-4"/>}
                            value={singleFormik.values.gradeLevel}
                            error={singleFormik.touched.gradeLevel && singleFormik.errors.gradeLevel}
                            onChange={handleGradeLevelChange}
                            onBlur={singleFormik.handleBlur}
                            options={GRADE_LEVEL_OPTIONS}
                            required
                        />
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-400 mb-1.5">
                                Classes
                            </label>
                            {classesForGradeLevel.length === 0 ? (
                                <p className="text-xs text-gray-400 dark:text-dark-500 p-3 text-center rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                                    No {GRADE_LEVEL_LABELS[singleFormik.values.gradeLevel]} classes exist yet.
                                </p>
                            ) : (
                                <div className="rounded-lg border border-gray-200 dark:border-dark-700 divide-y divide-gray-100 dark:divide-dark-800 max-h-48 overflow-y-auto">
                                    {classesForGradeLevel.map(cls => (
                                        <label key={cls.id} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-850 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={singleFormik.values.classIds.includes(cls.id)}
                                                onChange={() => toggleClassId(cls.id)}
                                                className="rounded border-gray-300 dark:border-dark-600 text-primary-600 focus:ring-primary-500"
                                            />
                                            <School className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
                                            <span className="text-sm text-gray-700 dark:text-dark-200">{cls.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={singleSubmitting}>
                                {singleSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {editingSubject ? 'Update' : 'Create'} Subject
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Bulk Add Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-lg">Bulk Add Subjects</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={bulkFormik.handleSubmit} className="space-y-4">
                        <ServerError message={bulkError} onDismiss={clearBulkError}/>
                        <FormSelect
                            label="Class"
                            name="classId"
                            icon={<Layers className="h-4 w-4"/>}
                            placeholder="Select class"
                            value={bulkFormik.values.classId}
                            error={bulkFormik.touched.classId && bulkFormik.errors.classId}
                            onChange={bulkFormik.handleChange}
                            onBlur={bulkFormik.handleBlur}
                            options={classOptions}
                            required
                        />
                        <FormField
                            label="Subjects (one per line)"
                            name="subjects"
                            icon={<BookOpen className="h-4 w-4"/>}
                            placeholder={'English\nMathematics\nScience\nUrdu'}
                            value={bulkFormik.values.subjects}
                            error={bulkFormik.touched.subjects && bulkFormik.errors.subjects}
                            onChange={bulkFormik.handleChange}
                            onBlur={bulkFormik.handleBlur}
                            textarea
                            rows={6}
                            required
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setBulkDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={bulkSubmitting}>
                                {bulkSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                Create Subjects
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
