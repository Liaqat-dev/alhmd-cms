import {useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {classesAPI, teachersAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {
    ArrowLeft,
    Award,
    Banknote,
    Building2,
    Calendar,
    GraduationCap,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Sun,
    Trash2,
    User,
    Users,
} from 'lucide-react'
import useAppForm from '@/hooks/useAppForm'
import {FormDate, FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import {Tabs, Tab} from '@/components/custom/Tab'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'

const TODAY = new Date().toISOString().split('T')[0]

const TIER_OPTIONS = [
    {value: 'TIER_1',  label: 'Tier 1 (Senior)'},
    {value: 'TIER_2A', label: 'Tier 2A'},
    {value: 'TIER_2B', label: 'Tier 2B'},
    {value: 'TIER_3',  label: 'Tier 3 (Junior)'},
]

const CURRENT_YEAR = new Date().getFullYear()

const initialValues = {
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    joiningDate: TODAY,
    additionalPay: '',
    basicSalary: '',
    tier: 'TIER_3',
}

const makeQualification = () => ({
    _key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    id: undefined,
    degreeTitle: '',
    institute: '',
    startYear: '',
    endYear: '',
    totalMarksOrGpa: '',
    obtainedMarksOrGpa: '',
})

export default function AddTeacher() {
    const navigate = useNavigate()
    const {id} = useParams()
    const isEditing = !!id
    const {toast} = useToast()

    const [allClasses, setAllClasses] = useState([])
    const [classAssignments, setClassAssignments] = useState({})
    const [loadingTeacher, setLoadingTeacher] = useState(isEditing)
    const [qualifications, setQualifications] = useState([])

    const schema = useMemo(() => Yup.object({
        name: Yup.string().required('Name is required'),
        email: Yup.string().email('Invalid email').required('Email is required'),
        ...(!isEditing ? {
            password: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
        } : {}),
        phone: Yup.string(),
        joiningDate: Yup.string(),
        address: Yup.string(),
        additionalPay: Yup.number()
            .nullable()
            .transform((v, o) => (o === '' ? null : v))
            .min(0, 'Must be 0 or more'),
        basicSalary: Yup.number().nullable().transform((v, o) => (o === '' ? null : v)).min(0, 'Must be 0 or more'),
        tier: Yup.string().oneOf(['TIER_1', 'TIER_2A', 'TIER_2B', 'TIER_3']),
    }), [isEditing])

    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues,
        validationSchema: schema,
        onSubmit: async (values) => {
            const classAssignmentsArray = Object.entries(classAssignments).map(([classId, subjectIds]) => ({
                classId: parseInt(classId, 10), subjectIds
            }))
            const qualificationsPayload = qualifications
                .filter(q => q.degreeTitle.trim())
                .map(({_key, ...q}) => q)
            if (isEditing) {
                const {password, ...updateData} = values
                await teachersAPI.update(id, {...updateData, classAssignments: classAssignmentsArray, qualifications: qualificationsPayload})
            } else {
                await teachersAPI.create({...values, classAssignments: classAssignmentsArray, qualifications: qualificationsPayload})
            }
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: isEditing ? 'Teacher updated successfully' : 'Teacher created successfully',
            })
            navigate('/admin/teachers')
        },
    })

    useEffect(() => {
        fetchAllClasses()
        if (id) fetchTeacher()
    }, [id])

    const fetchAllClasses = async () => {
        try {
            const res = await classesAPI.getAllBatches()
            setAllClasses(res.data.classes || [])
        } catch {/* non-fatal */}
    }

    const fetchTeacher = async () => {
        try {
            const res = await teachersAPI.getById(id)
            const t = res.data.teacher
            formik.resetForm({
                values: {
                    email: t.user?.email || '',
                    password: '',
                    name: t.name || '',
                    phone: t.phone || '',
                    address: t.address || '',
                    joiningDate: t.joiningDate?.split('T')[0] || TODAY,
                    additionalPay: t.additionalPay ?? '',
                    basicSalary: t.basicSalary ?? '',
                    tier: t.tier || 'TIER_3',
                },
            })

            setQualifications((t.qualifications || []).map(q => ({
                _key: q.id,
                id: q.id,
                degreeTitle: q.degreeTitle || '',
                institute: q.institute || '',
                startYear: q.startYear != null ? String(q.startYear) : '',
                endYear: q.endYear != null ? String(q.endYear) : '',
                totalMarksOrGpa: q.totalMarksOrGpa || '',
                obtainedMarksOrGpa: q.obtainedMarksOrGpa || '',
            })))

            // Reconstruct classAssignments keyed by classId
            const assignments = {}
            ;(t.teacherSubjects || []).forEach(ts => {
                const key = ts.subject?.classId
                if (!assignments[key]) assignments[key] = []
                if (!assignments[key].includes(ts.subjectId)) {
                    assignments[key].push(ts.subjectId)
                }
            })
            setClassAssignments(assignments)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to load teacher'})
            navigate('/admin/teachers')
        } finally {
            setLoadingTeacher(false)
        }
    }

    // ── Class/Subject helpers (key = classId) ──
    const isClassSelected = (key) => key in classAssignments
    const isSubjectSelected = (key, subjectId) => (classAssignments[key] || []).includes(subjectId)

    const toggleClass = (key) => {
        setClassAssignments(prev => {
            if (key in prev) {
                const {[key]: _, ...rest} = prev
                return rest
            }
            return {...prev, [key]: []}
        })
    }

    const toggleSubject = (key, subjectId) => {
        setClassAssignments(prev => {
            const current = prev[key] || []
            const updated = current.includes(subjectId)
                ? current.filter(sid => sid !== subjectId)
                : [...current, subjectId]
            return {...prev, [key]: updated}
        })
    }

    const selectAllSubjects = (key, subjects) => {
        setClassAssignments(prev => ({...prev, [key]: subjects.map(s => s.id)}))
    }

    const clearSubjects = (key) => {
        setClassAssignments(prev => ({...prev, [key]: []}))
    }

    // ── Qualification handlers (add/edit happens in a modal) ──
    const [qualModalOpen, setQualModalOpen] = useState(false)
    const [editingQualKey, setEditingQualKey] = useState(null)
    const [qualDraft, setQualDraft] = useState(makeQualification())
    const [qualErrors, setQualErrors] = useState({})

    const openAddQualification = () => {
        setEditingQualKey(null)
        setQualDraft(makeQualification())
        setQualErrors({})
        setQualModalOpen(true)
    }

    const openEditQualification = (q) => {
        setEditingQualKey(q._key)
        setQualDraft({...q})
        setQualErrors({})
        setQualModalOpen(true)
    }

    const updateQualDraftField = (field, value) => {
        setQualDraft(prev => ({...prev, [field]: value}))
        setQualErrors(prev => (prev[field] ? {...prev, [field]: undefined} : prev))
    }

    const validateQualDraft = (draft) => {
        const errors = {}
        if (!draft.degreeTitle.trim()) errors.degreeTitle = 'Required'
        if (!draft.institute.trim()) errors.institute = 'Required'
        if (!String(draft.startYear).trim()) errors.startYear = 'Required'
        if (!String(draft.endYear).trim()) errors.endYear = 'Required'
        if (!draft.totalMarksOrGpa.trim()) errors.totalMarksOrGpa = 'Required'
        if (!draft.obtainedMarksOrGpa.trim()) errors.obtainedMarksOrGpa = 'Required'
        if (!errors.startYear && !errors.endYear && Number(draft.endYear) < Number(draft.startYear)) {
            errors.endYear = 'Must be on/after start year'
        }
        return errors
    }

    const saveQualification = () => {
        const errors = validateQualDraft(qualDraft)
        if (Object.keys(errors).length > 0) {
            setQualErrors(errors)
            return
        }
        if (editingQualKey) {
            setQualifications(prev => prev.map(q => q._key === editingQualKey ? qualDraft : q))
        } else {
            setQualifications(prev => [...prev, qualDraft])
        }
        setQualModalOpen(false)
    }

    const removeQualification = (key) => setQualifications(prev => prev.filter(q => q._key !== key))

    // Latest degree first — sorted by end year, then start year
    const sortedQualifications = [...qualifications].sort((a, b) => {
        const endDiff = (parseInt(b.endYear, 10) || 0) - (parseInt(a.endYear, 10) || 0)
        if (endDiff !== 0) return endDiff
        return (parseInt(b.startYear, 10) || 0) - (parseInt(a.startYear, 10) || 0)
    })

    // ── Class section ─────────────────────────────────
    const ClassSection = ({classes}) => {
        if (classes.length === 0) return null
        return (
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5 bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300">
                        <Sun className="h-3 w-3"/>
                        Classes
                    </span>
                </div>
                <div className="space-y-2">
                    {classes.map(cls => {
                        const key = cls.id
                        const selected = isClassSelected(key)
                        const subjects = cls.subjects || []
                        return (
                            <div key={cls.id} className={`rounded-lg border transition-colors ${
                                selected
                                    ? 'border-primary-500/30 dark:border-primary-500/40 bg-primary-500/5 dark:bg-primary-500/[0.08]'
                                    : 'border-gray-200 dark:border-dark-700'
                            }`}>
                                <label className="flex items-center gap-2 cursor-pointer px-3 py-2.5">
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => toggleClass(key)}
                                        className="rounded shrink-0"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-dark-200 flex-1">{cls.name}</span>
                                    {subjects.length > 0 && (
                                        <span className="text-[11px] text-gray-400 dark:text-dark-500">
                                            {selected
                                                ? `${(classAssignments[key] || []).length}/${subjects.length} subjects`
                                                : `${subjects.length} subjects`}
                                        </span>
                                    )}
                                </label>

                                {selected && subjects.length > 0 && (
                                    <div className="border-t border-dashed border-gray-200 dark:border-dark-700 mx-3 pb-2.5 pt-2">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[11px] text-gray-400 dark:text-dark-500 font-medium">Assign subjects:</span>
                                            <div className="flex gap-3">
                                                <button type="button" onClick={() => selectAllSubjects(key, subjects)}
                                                    className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline">All</button>
                                                <button type="button" onClick={() => clearSubjects(key)}
                                                    className="text-[11px] text-gray-400 dark:text-dark-500 hover:underline">None</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                                            {subjects.map(sub => (
                                                <label key={sub.id} className={`flex items-center gap-1.5 cursor-pointer text-[12px] rounded px-2 py-1 transition-colors ${
                                                    isSubjectSelected(key, sub.id)
                                                        ? 'bg-primary-500/10 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 font-medium'
                                                        : 'hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-500 dark:text-dark-400'
                                                }`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSubjectSelected(key, sub.id)}
                                                        onChange={() => toggleSubject(key, sub.id)}
                                                        className="rounded shrink-0"
                                                    />
                                                    {sub.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selected && subjects.length === 0 && (
                                    <div className="border-t border-dashed border-gray-200 dark:border-dark-700 mx-3 pb-2 pt-2">
                                        <p className="text-[11px] text-gray-400 dark:text-dark-500">No subjects defined for this class yet.</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ── Tab content ────────────────────────────────────────────────────────────
    const personalInfoTab = (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
                <FormField
                    label="Full Name"
                    name="name"
                    icon={<User className="h-4 w-4"/>}
                    value={formik.values.name}
                    error={formik.touched.name && formik.errors.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                />
            </div>

            <FormField
                label="Email"
                name="email"
                type="email"
                icon={<Mail className="h-4 w-4"/>}
                value={formik.values.email}
                error={formik.touched.email && formik.errors.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
            />

            {!isEditing && (
                <FormField
                    label="Password"
                    name="password"
                    type="password"
                    icon={<Lock className="h-4 w-4"/>}
                    value={formik.values.password}
                    error={formik.touched.password && formik.errors.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    required
                />
            )}

            <FormField
                label="Phone"
                name="phone"
                icon={<Phone className="h-4 w-4"/>}
                value={formik.values.phone}
                error={formik.touched.phone && formik.errors.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
            />
            <FormDate
                label="Joining Date"
                name="joiningDate"
                icon={<Calendar className="h-4 w-4"/>}
                value={formik.values.joiningDate}
                error={formik.touched.joiningDate && formik.errors.joiningDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
            />
            <FormSelect
                label="Tier"
                name="tier"
                icon={<Award className="h-4 w-4"/>}
                value={formik.values.tier}
                error={formik.touched.tier && formik.errors.tier}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                options={TIER_OPTIONS}
            />
            <div className="sm:col-span-2">
                <FormField
                    label="Address"
                    name="address"
                    icon={<MapPin className="h-4 w-4"/>}
                    value={formik.values.address}
                    error={formik.touched.address && formik.errors.address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />
            </div>
        </div>
    )

    const salaryTab = (
        <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-dark-400">
                Set the fixed monthly salary amounts for each program. These values will be used as the teacher's salary.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                    label="Basic Salary (Rs.)"
                    name="basicSalary"
                    type="number"
                    icon={<Banknote className="h-4 w-4"/>}
                    placeholder="0"
                    value={formik.values.basicSalary}
                    error={formik.touched.basicSalary && formik.errors.basicSalary}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />
                <FormField
                    label="Additional Pay (Rs.)"
                    name="additionalPay"
                    type="number"
                    icon={<Banknote className="h-4 w-4"/>}
                    placeholder="0"
                    value={formik.values.additionalPay}
                    error={formik.touched.additionalPay && formik.errors.additionalPay}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                />
            </div>
        </div>
    )

    const qualificationsTab = (
        <div>
            <div className="flex items-start justify-between gap-3 mb-4">
                <p className="text-sm text-gray-500 dark:text-dark-400">
                    Add the teacher's degrees and certifications. Cards order themselves automatically, most recent first.
                </p>
                <button
                    type="button"
                    onClick={openAddQualification}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 border border-primary-200 dark:border-primary-400/30 rounded-lg px-3 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-400/8 transition-colors shrink-0"
                >
                    <Plus className="h-3.5 w-3.5"/>
                    Add Qualification
                </button>
            </div>

            {qualifications.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-dark-500 text-center py-10 rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                    No qualifications added yet. Click "Add Qualification" to record the teacher's education history.
                </p>
            ) : (
                <div className="relative pl-7">
                    <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-300 dark:from-indigo-400/40 via-gray-200 dark:via-dark-700 to-transparent"/>
                    <div className="space-y-4">
                        {sortedQualifications.map((q, idx) => (
                            <div key={q._key} className="relative">
                                <span className={`absolute -left-7 top-5 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-dark-900 ${
                                    idx === 0 ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-dark-600'
                                }`}/>
                                <div className="rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 overflow-hidden">
                                    <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-dark-100 flex items-center gap-1.5">
                                                <GraduationCap className="h-4 w-4 text-indigo-500 shrink-0"/>
                                                <span className="truncate">{q.degreeTitle}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1.5 mt-1">
                                                <Building2 className="h-3 w-3 shrink-0"/>
                                                <span className="truncate">{q.institute}</span>
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-dark-400 bg-gray-50 dark:bg-dark-850 border border-gray-200 dark:border-dark-700 rounded-full px-2.5 py-0.5">
                                            {q.startYear}–{q.endYear}
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => openEditQualification(q)}
                                                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-400/10 rounded-lg transition-colors"
                                                title="Edit qualification"
                                            >
                                                <Pencil className="h-3.5 w-3.5"/>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeQualification(q._key)}
                                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg transition-colors"
                                                title="Remove qualification"
                                            >
                                                <Trash2 className="h-3.5 w-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-3.5 -mt-1">
                                        <p className="text-xs text-gray-400 dark:text-dark-500">
                                            Score: <span className="text-gray-600 dark:text-dark-300 font-medium">{q.obtainedMarksOrGpa}</span> / {q.totalMarksOrGpa}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    const assignmentsTab = (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-gray-500 dark:text-dark-400">
                    Select the classes this teacher will handle, then choose specific subjects within each class.
                </p>
                <span className="text-xs text-gray-400 dark:text-dark-500 shrink-0">
                    {Object.keys(classAssignments).length} class(es) selected
                </span>
            </div>

            {allClasses.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-dark-400 rounded-lg border border-gray-200 dark:border-dark-700 p-6 text-center">
                    No classes available. Create classes first.
                </p>
            ) : (
                <div className="space-y-6">
                    <ClassSection classes={allClasses}/>
                </div>
            )}
        </div>
    )

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loadingTeacher) {
        return (
            <DashboardLayout title={isEditing ? 'Edit Teacher' : 'Add Teacher'}>
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400"/>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title={isEditing ? 'Edit Teacher' : 'Add Teacher'}>
            <div className="max-w-5xl mx-auto">
                <div className="card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-dark-700">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/teachers')}
                            className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-gray-500 dark:text-dark-400"
                        >
                            <ArrowLeft className="h-4 w-4"/>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/15 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/10">
                                <Users className="h-4 w-4 text-violet-600 dark:text-violet-400"/>
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-gray-900 dark:text-dark-50">
                                    {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
                                </h1>
                                {isEditing && (
                                    <p className="text-xs text-gray-400 dark:text-dark-500">{formik.values.name}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={formik.handleSubmit}>
                        <ServerError message={serverError} onDismiss={clearServerError}/>

                        <div className="px-6 pt-4">
                            <Tabs
                                ulProps="flex overflow-x-auto border-b border-gray-200 dark:border-dark-700 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                liProps="shrink-0"
                                otherClass="flex items-center gap-1.5 px-4 py-2 text-sm font-medium cursor-pointer transition-colors border-b-2 -mb-px whitespace-nowrap"
                                activeTabClass="border-primary-500 text-primary-600 dark:text-primary-400"
                                inactiveTabClass="border-transparent text-gray-500 dark:text-dark-400 hover:text-gray-700 dark:hover:text-dark-200 hover:border-gray-300 dark:hover:border-dark-600"
                                contentProps="py-6"
                            >
                                <Tab label="Personal Info" icon={<User className="h-3.5 w-3.5"/>}>
                                    {personalInfoTab}
                                </Tab>
                                <Tab label="Salary" icon={<Banknote className="h-3.5 w-3.5"/>}>
                                    {salaryTab}
                                </Tab>
                                <Tab label="Qualifications" icon={<GraduationCap className="h-3.5 w-3.5"/>}>
                                    {qualificationsTab}
                                </Tab>
                                <Tab label="Assignments" icon={<Users className="h-3.5 w-3.5"/>}>
                                    {assignmentsTab}
                                </Tab>
                            </Tabs>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                            <Button type="button" variant="outline" onClick={() => navigate('/admin/teachers')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {isEditing ? 'Update' : 'Create'} Teacher
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Add / Edit Qualification modal */}
            <Dialog open={qualModalOpen} onOpenChange={setQualModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingQualKey ? 'Edit Qualification' : 'Add Qualification'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <FormField
                            label="Degree / Certificate Title"
                            name="degreeTitle"
                            icon={<GraduationCap className="h-4 w-4"/>}
                            placeholder="e.g., BSc Computer Science"
                            value={qualDraft.degreeTitle}
                            error={qualErrors.degreeTitle}
                            onChange={e => updateQualDraftField('degreeTitle', e.target.value)}
                            required
                        />
                        <FormField
                            label="Institute"
                            name="institute"
                            icon={<Building2 className="h-4 w-4"/>}
                            placeholder="e.g., University of the Punjab"
                            value={qualDraft.institute}
                            error={qualErrors.institute}
                            onChange={e => updateQualDraftField('institute', e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Start Year"
                                name="startYear"
                                type="number"
                                icon={<Calendar className="h-4 w-4"/>}
                                placeholder={String(CURRENT_YEAR - 4)}
                                value={qualDraft.startYear}
                                error={qualErrors.startYear}
                                onChange={e => updateQualDraftField('startYear', e.target.value)}
                                required
                            />
                            <FormField
                                label="End Year"
                                name="endYear"
                                type="number"
                                icon={<Calendar className="h-4 w-4"/>}
                                placeholder={String(CURRENT_YEAR)}
                                value={qualDraft.endYear}
                                error={qualErrors.endYear}
                                onChange={e => updateQualDraftField('endYear', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Total Marks / GPA"
                                name="totalMarksOrGpa"
                                icon={<Award className="h-4 w-4"/>}
                                placeholder="e.g. 1100 or 4.0"
                                value={qualDraft.totalMarksOrGpa}
                                error={qualErrors.totalMarksOrGpa}
                                onChange={e => updateQualDraftField('totalMarksOrGpa', e.target.value)}
                                required
                            />
                            <FormField
                                label="Obtained Marks / GPA"
                                name="obtainedMarksOrGpa"
                                icon={<Award className="h-4 w-4"/>}
                                placeholder="e.g. 980 or 3.8"
                                value={qualDraft.obtainedMarksOrGpa}
                                error={qualErrors.obtainedMarksOrGpa}
                                onChange={e => updateQualDraftField('obtainedMarksOrGpa', e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setQualModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" onClick={saveQualification}>
                            {editingQualKey ? 'Save Changes' : 'Add Qualification'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
