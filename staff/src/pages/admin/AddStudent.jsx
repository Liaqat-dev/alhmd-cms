import {useEffect, useMemo, useState} from 'react'
import {useNavigate, useParams, useSearchParams} from 'react-router-dom'
import * as Yup from 'yup'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Button} from '@/components/ui/button'
import {classesAPI, studentsAPI, studentExpensesAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {
    ArrowLeft,
    BookOpen,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    GraduationCap,
    Hash,
    Loader2,
    Lock,
    Mail,
    MapPin,
    Phone,
    Plus,
    Sun,
    Trash2,
    User,
} from 'lucide-react'
import useAppForm from '@/hooks/useAppForm'
import {FormDate, FormField, FormSelect, ServerError} from '@/components/ui/form-fields'
import {Tabs, Tab} from '@/components/custom/Tab'
import StudentDocuments from '@/components/shared/StudentDocuments'

// ── Constants ──────────────────────────────────────────────────────────────────

const EXPENSE_TYPE_OPTIONS = [
    {value: 'ADMISSION_FEE', label: 'Admission Fee'},
    {value: 'MISC_FEE',      label: 'Misc. Fee'},
    {value: 'BAG',           label: 'Bag'},
    {value: 'UNIFORM',       label: 'Uniform'},
    {value: 'BOOKS',         label: 'Books'},
    {value: 'OTHER',         label: 'Other'},
]

const currentYear = new Date().getFullYear()

const MONTH_OPTIONS = [
    {value: '1', label: 'January'}, {value: '2', label: 'February'},
    {value: '3', label: 'March'},   {value: '4', label: 'April'},
    {value: '5', label: 'May'},     {value: '6', label: 'June'},
    {value: '7', label: 'July'},    {value: '8', label: 'August'},
    {value: '9', label: 'September'},{value: '10', label: 'October'},
    {value: '11', label: 'November'},{value: '12', label: 'December'},
]

const YEAR_OPTIONS = Array.from({length: 5}, (_, i) => {
    const y = currentYear - 1 + i
    return {value: String(y), label: String(y)}
})

const defaultAcademicYear = `${currentYear}-${currentYear + 2}`

const initialStudentValues = {
    name: '',
    fatherName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    cnic: '',
    address: '',
    phone: '',
    guardianPhone: '',
    schoolName: '',
    rollNumber: '',
    monthlyFee: '',
    joiningDate: new Date().toISOString().split('T')[0],
    academicYear: defaultAcademicYear,
    status: 'ENROLLED',
    password: '',
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AddStudent() {
    const navigate = useNavigate()
    const {id} = useParams()
    const [searchParams] = useSearchParams()
    const isEditing = !!id

    const [allClasses, setAllClasses] = useState([])
    const [loadingClasses, setLoadingClasses] = useState(true)
    const [loadingStudent, setLoadingStudent] = useState(isEditing)
    const [regularClassId, setRegularClassId] = useState('')
    const [regularSubjectEnrollments, setRegularSubjectEnrollments] = useState([])
    const [expenses, setExpenses] = useState([])
    const [originalExpenseIds, setOriginalExpenseIds] = useState([])
    const {toast} = useToast()

    const studentSchema = useMemo(() => Yup.object({
        name: Yup.string().required('Name is required'),
        fatherName: Yup.string().required('Father name is required'),
        email: Yup.string().email('Invalid email address'),
        dateOfBirth: Yup.string().required('Date of birth is required'),
        gender: Yup.string().required('Gender is required'),
        cnic: Yup.string(),
        schoolName: Yup.string(),
        address: Yup.string().required('Address is required'),
        phone: Yup.string(),
        guardianPhone: Yup.string().required('Guardian phone is required'),
        monthlyFee: Yup.number()
            .nullable()
            .transform((v, o) => (o === '' ? null : v))
            .min(0, 'Must be 0 or more'),
        joiningDate: Yup.string().required('Joining date is required'),
        academicYear: Yup.string().required('Academic year is required'),
        status: Yup.string().required('Status is required'),
        password: Yup.string().test(
            'min-if-set',
            'Minimum 8 characters',
            (val) => !val || val.length >= 8
        ),
    }), [isEditing])

    const syncExpenses = async (studentId) => {
        const currentIds = expenses.filter(e => e.id).map(e => e.id)
        const toDelete = originalExpenseIds.filter(oid => !currentIds.includes(oid))
        await Promise.all(toDelete.map(oid => studentExpensesAPI.delete(oid)))
        const toCreate = expenses.filter(e => !e.id)
        await Promise.all(toCreate.map(e => studentExpensesAPI.create({
            studentId,
            type: e.type,
            amount: e.amount,
            month: parseInt(e.month),
            year: parseInt(e.year),
        })))
    }

    const {formik, isSubmitting, serverError, clearServerError} = useAppForm({
        initialValues: initialStudentValues,
        validationSchema: studentSchema,
        onSubmit: async (values) => {
            const payload = {
                ...values,
                regularClassId: regularClassId || null,
                regularSubjectEnrollments,
            }
            if (isEditing) {
                // Roll number is permanent once assigned, so it is never sent back.
                const {rollNumber: _fixedRollNumber, ...updatePayload} = payload
                await studentsAPI.update(id, updatePayload)
                await syncExpenses(id)
                return null
            } else {
                const response = await studentsAPI.create(payload)
                const newStudentId = response.data.student?.student?.id
                if (newStudentId && expenses.length > 0) {
                    await syncExpenses(newStudentId)
                }
                return response.data.rollNumber
            }
        },
        onSuccess: (rollNumber) => {
            if (rollNumber) {
                toast({title: 'Success', description: `Student created. Roll Number: ${rollNumber}`})
            } else {
                toast({title: 'Success', description: 'Student updated successfully'})
            }
            navigate({
                pathname: '/students',
                search: searchParams.toString()
            })
        },
    })

    useEffect(() => {
        fetchAllClasses()
        if (id) fetchStudent()
    }, [id])

    const fetchAllClasses = async () => {
        try {
            const classesRes = await classesAPI.getAllBatches()
            setAllClasses(classesRes.data.classes)
        } catch {
            // non-fatal
        } finally {
            setLoadingClasses(false)
        }
    }

    const fetchStudent = async () => {
        try {
            const response = await studentsAPI.getById(id)
            const student = response.data.student
            setRegularClassId(student.regularClassId || '')
            setRegularSubjectEnrollments((student.regularSubjectEnrollments || []).map(ss => ({
                subjectId: ss.subjectId
            })))
            formik.resetForm({
                values: {
                    rollNumber: student.rollNumber || '',
                    name: student.name,
                    fatherName: student.fatherName,
                    email: student.email || '',
                    dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
                    gender: student.gender,
                    cnic: student.cnic || '',
                    address: student.address,
                    phone: student.phone || '',
                    guardianPhone: student.guardianPhone,
                    schoolName: student.schoolName || '',
                    monthlyFee: student.monthlyFee?.toString() || '',
                    joiningDate: student.joiningDate?.split('T')[0] || '',
                    academicYear: student.academicYear || defaultAcademicYear,
                    status: student.status || 'ENROLLED',
                    password: '',
                },
            })
            const expRes = await studentExpensesAPI.getByStudent(id)
            const unlinked = (expRes.data.expenses || []).filter(
                e => !e.challanId
            )
            setExpenses(unlinked.map(e => ({
                _key: e.id,
                id: e.id,
                type: e.type,
                amount: String(e.amount),
                month: String(e.month),
                year: String(e.year),
            })))
            setOriginalExpenseIds(unlinked.map(e => e.id))
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to load student'})
            navigate({
                pathname: '/students',
                search: searchParams.toString()
            })
        } finally {
            setLoadingStudent(false)
        }
    }

    // ── Derived state ──────────────────────────────────────────────────────────
    const regularClass = allClasses.find(c => c.id === regularClassId)
    const regularClassSubjects = regularClass?.subjects || []
    const selectedRegularSubjectIds = regularSubjectEnrollments.map(e => e.subjectId)

    const academicYearOptions = Array.from({length: 5}, (_, i) => {
        const year = currentYear - 4 + i
        const label = `${year}-${year + 2}`
        return {value: label, label}
    })

    // ── Enrollment handlers ────────────────────────────────────────────────────
    const handleRegularSelect = (cls) => {
        if (regularClassId === cls.id) {
            setRegularClassId('')
            setRegularSubjectEnrollments([])
        } else {
            setRegularClassId(cls.id)
            setRegularSubjectEnrollments([])
        }
    }

    const toggleRegularSubject = (subject) => {
        setRegularSubjectEnrollments(prev => {
            const exists = prev.find(e => e.subjectId === subject.id)
            if (exists) return prev.filter(e => e.subjectId !== subject.id)
            return [...prev, {subjectId: subject.id}]
        })
    }

    const updateRegularSubjectField = (subjectId, field, value) => {
        setRegularSubjectEnrollments(prev =>
            prev.map(e => e.subjectId === subjectId ? {...e, [field]: value} : e)
        )
    }

    // ── Expense handlers ───────────────────────────────────────────────────────
    const addExpense = () => {
        setExpenses(prev => [...prev, {
            _key: Date.now(),
            id: undefined,
            type: 'MISC_FEE',
            amount: '',
            month: String(new Date().getMonth() + 1),
            year: String(new Date().getFullYear()),
        }])
    }

    const removeExpense = (key) => setExpenses(prev => prev.filter(e => e._key !== key))

    const updateExpenseField = (key, field, value) =>
        setExpenses(prev => prev.map(e => e._key === key ? {...e, [field]: value} : e))

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loadingStudent) {
        return (
            <DashboardLayout title={isEditing ? 'Edit Student' : 'Add Student'}>
                <div className="flex items-center justify-center min-h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500"/>
                </div>
            </DashboardLayout>
        )
    }

    // ── Tab content ────────────────────────────────────────────────────────────

     const personalInfoTab = (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <FormField
                label="Father Name"
                name="fatherName"
                icon={<User className="h-4 w-4"/>}
                value={formik.values.fatherName}
                error={formik.touched.fatherName && formik.errors.fatherName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
            />
            <FormDate
                label="Date of Birth"
                name="dateOfBirth"
                icon={<Calendar className="h-4 w-4"/>}
                value={formik.values.dateOfBirth}
                error={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
            />
            <FormSelect
                label="Gender"
                name="gender"
                icon={<User className="h-4 w-4"/>}
                value={formik.values.gender}
                error={formik.touched.gender && formik.errors.gender}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
                options={[
                    {value: 'MALE', label: 'Male'},
                    {value: 'FEMALE', label: 'Female'},
                ]}
            />
            <FormField
                label="CNIC"
                name="cnic"
                icon={<CreditCard className="h-4 w-4"/>}
                placeholder="XXXXX-XXXXXXXX-X"
                value={formik.values.cnic}
                error={formik.touched.cnic && formik.errors.cnic}
                onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '')
                    if (val.length > 13) val = val.slice(0, 13)
                    if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5)
                    if (val.length > 13) val = val.slice(0, 13) + '-' + val.slice(13)
                    formik.setFieldValue('cnic', val)
                }}
                onBlur={formik.handleBlur}
            />
            <FormField
                label="Phone"
                name="phone"
                icon={<Phone className="h-4 w-4"/>}
                value={formik.values.phone}
                error={formik.touched.phone && formik.errors.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
            />
            <FormField
                label="Guardian Phone"
                name="guardianPhone"
                icon={<Phone className="h-4 w-4"/>}
                value={formik.values.guardianPhone}
                error={formik.touched.guardianPhone && formik.errors.guardianPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
            />
            <FormField
                label="School Name"
                name="schoolName"
                icon={<Building2 className="h-4 w-4"/>}
                placeholder="Previous / current school"
                value={formik.values.schoolName}
                error={formik.touched.schoolName && formik.errors.schoolName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
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
                    required
                />
            </div>
        </div>
    )

    // ── Subject panel renderer ─────────────────────────────────────────────────
    const renderSubjectPanel = (subjects, enrollments, onToggle, onFieldUpdate, onSelectAll, onClearAll, color, showFeeColumns = true) => {
        const colors = {
            amber:  { check: 'text-amber-600 focus:ring-amber-500',  btn: 'text-amber-600 dark:text-amber-400',  ring: 'focus:ring-amber-500/30',  border: 'border-amber-200 dark:border-amber-400/30' },
            purple: { check: 'text-purple-600 focus:ring-purple-500', btn: 'text-purple-600 dark:text-purple-400', ring: 'focus:ring-purple-500/30', border: 'border-purple-200 dark:border-purple-400/30' },
        }
        const c = colors[color] || colors.amber
        const selectedIds = enrollments.map(e => e.subjectId)
        if (subjects.length === 0) return (
            <p className="text-xs text-gray-400 dark:text-dark-500 p-3 text-center rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                No subjects defined for this class yet.
            </p>
        )
        return (
            <div className="rounded-lg border border-gray-200 dark:border-dark-700 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-dark-850 border-b border-gray-200 dark:border-dark-700">
                    <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
                        <span className="text-xs font-semibold text-gray-600 dark:text-dark-300">
                            Subjects <span className="font-normal text-gray-400 dark:text-dark-500">({selectedIds.length}/{subjects.length})</span>
                        </span>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onSelectAll} className={`text-[11px] font-medium hover:underline ${c.btn}`}>All</button>
                        <button type="button" onClick={onClearAll} className="text-[11px] text-gray-400 dark:text-dark-500 hover:underline">None</button>
                    </div>
                </div>
                {showFeeColumns && (
                    <div className="hidden sm:grid grid-cols-[auto_1fr_1fr] items-center gap-3 px-3 py-1.5 bg-gray-50 dark:bg-dark-850">
                        <div className="w-5"/>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide">Fee (PKR)</p>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide">Teacher Share (%)</p>
                    </div>
                )}
                <div className="divide-y divide-gray-100 dark:divide-dark-800">
                    {subjects.map(subject => {
                        const enrollment = enrollments.find(e => e.subjectId === subject.id)
                        const isSel = !!enrollment
                        return showFeeColumns ? (
                            <div key={subject.id} className={`flex flex-col gap-2 sm:grid sm:grid-cols-[auto_1fr_1fr] sm:items-center sm:gap-3 px-3 py-2.5 transition-colors ${isSel ? 'bg-gray-50/80 dark:bg-dark-850/80' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}>
                                <label className="flex items-center gap-2 cursor-pointer min-w-0">
                                    <input type="checkbox" checked={isSel} onChange={() => onToggle(subject)}
                                        className={`rounded border-gray-300 dark:border-dark-600 shrink-0 ${c.check}`}/>
                                    <span className={`text-sm font-medium ${isSel ? 'text-gray-700 dark:text-dark-100' : 'text-gray-400 dark:text-dark-500'}`}>
                                        {subject.name}
                                    </span>
                                </label>
                                <div className="flex gap-2 sm:contents">
                                    <input type="number" min="0" placeholder="Fee (PKR)"
                                        value={enrollment?.fee ?? ''} disabled={!isSel}
                                        onChange={e => onFieldUpdate(subject.id, 'fee', e.target.value)}
                                        className={`flex-1 sm:flex-none w-full rounded-lg border px-3 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 ${c.ring} ${isSel ? `${c.border} bg-white dark:bg-dark-900 text-gray-800 dark:text-dark-100` : 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-850 text-gray-300 dark:text-dark-600 cursor-not-allowed'}`}/>
                                    <div className="relative flex-1 sm:flex-none">
                                        <input type="number" min="0" max="100" placeholder="Share %"
                                            value={enrollment?.teacherShare ?? ''} disabled={!isSel}
                                            onChange={e => { const v = e.target.value; if (v === '' || (parseFloat(v) >= 0 && parseFloat(v) <= 100)) onFieldUpdate(subject.id, 'teacherShare', v) }}
                                            className={`w-full rounded-lg border pl-3 pr-8 py-1.5 text-sm transition-colors focus:outline-none focus:ring-2 ${c.ring} ${isSel ? `${c.border} bg-white dark:bg-dark-900 text-gray-800 dark:text-dark-100` : 'border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-850 text-gray-300 dark:text-dark-600 cursor-not-allowed'}`}/>
                                        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium pointer-events-none ${isSel ? 'text-gray-400 dark:text-dark-500' : 'text-gray-300 dark:text-dark-600'}`}>%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <label key={subject.id} className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${isSel ? 'bg-gray-50/80 dark:bg-dark-850/80' : 'hover:bg-gray-50 dark:hover:bg-dark-850'}`}>
                                <input type="checkbox" checked={isSel} onChange={() => onToggle(subject)}
                                    className={`rounded border-gray-300 dark:border-dark-600 shrink-0 ${c.check}`}/>
                                <span className={`text-sm font-medium ${isSel ? 'text-gray-700 dark:text-dark-100' : 'text-gray-400 dark:text-dark-500'}`}>
                                    {subject.name}
                                </span>
                            </label>
                        )
                    })}
                </div>
            </div>
        )
    }

    const enrollmentTab = (
        <div>
            {loadingClasses ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-dark-500">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    Loading classes...
                </div>
            ) : allClasses.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-dark-400 rounded-lg border border-dashed border-gray-200 dark:border-dark-700 p-4 text-center">
                    No classes available. Create classes first.
                </p>
            ) : (
                <div className="space-y-6">
                    {/* Roll Number */}
                    <div className="rounded-lg border border-gray-200 dark:border-dark-700 p-4 bg-gray-50/50 dark:bg-dark-850/50">
                        <div className="flex items-center gap-2 mb-3">
                            <Hash className="h-4 w-4 text-gray-600 dark:text-dark-300"/>
                            <label className="text-sm font-semibold text-gray-700 nowrap dark:text-dark-200">Roll Number</label>
                            <span className="text-xs text-gray-500 dark:text-dark-400 font-medium">
                                {isEditing ? '(Permanent — cannot be changed)' : '(Leave blank to auto-generate)'}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <input
                                type="text"
                                placeholder="e.g., ICS26-001"
                                value={formik.values.rollNumber || ''}
                                onChange={(e) => formik.setFieldValue('rollNumber', e.target.value)}
                                onBlur={formik.handleBlur}
                                readOnly={isEditing}
                                disabled={isEditing}
                                aria-readonly={isEditing}
                                title={isEditing ? 'Roll numbers cannot be changed once a student is created' : undefined}
                                className={`flex-1 w-24 rounded-lg border border-gray-200 dark:border-dark-700 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/40 ${
                                    isEditing
                                        ? 'bg-gray-100 dark:bg-dark-800 text-gray-500 dark:text-dark-400 cursor-not-allowed'
                                        : 'bg-white dark:bg-dark-900 text-gray-800 dark:text-dark-100'
                                }`}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-dark-400">
                            {isEditing
                                ? 'Roll numbers are permanent. Attendance, challans and documents are filed under this number.'
                                : 'Assigned on save as program + year + serial, e.g. ICS26-001. The serial runs in one sequence shared by all programs for the enrollment year.'}
                        </p>
                    </div>

                    {/* Enrollment details */}
                    <div className="rounded-lg border border-gray-200 dark:border-dark-700 p-4 bg-gray-50/50 dark:bg-dark-850/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormDate
                            label="Joining Date"
                            name="joiningDate"
                            icon={<Calendar className="h-4 w-4"/>}
                            value={formik.values.joiningDate}
                            error={formik.touched.joiningDate && formik.errors.joiningDate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                        />
                        <FormSelect
                            label="Academic Year"
                            name="academicYear"
                            icon={<GraduationCap className="h-4 w-4"/>}
                            value={formik.values.academicYear}
                            error={formik.touched.academicYear && formik.errors.academicYear}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            options={academicYearOptions}
                            required
                        />
                        <FormSelect
                            label="Status"
                            name="status"
                            icon={<GraduationCap className="h-4 w-4"/>}
                            value={formik.values.status}
                            error={formik.touched.status && formik.errors.status}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            required
                            options={[
                                {value: 'ENROLLED', label: 'Enrolled'},
                                {value: 'PENDING', label: 'Pending'},
                            ]}
                        />
                    </div>

                    {/* ── Classes ── */}
                    {allClasses.length > 0 && (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-400/25 overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-400/8 border-b border-amber-200 dark:border-amber-400/25">
                                <Sun className="h-4 w-4 text-amber-500 shrink-0"/>
                                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Classes</span>
                            </div>
                            <div className="p-4 space-y-5">
                                <div>
                                    <div className="mb-2">
                                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
                                            Class <span className="normal-case font-normal opacity-60">· pick one</span>
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {allClasses.map(cls => (
                                            <button key={cls.id} type="button" onClick={() => handleRegularSelect(cls)}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                                                    regularClassId === cls.id
                                                        ? 'border-amber-400 dark:border-amber-400/60 bg-amber-100 dark:bg-amber-400/15 text-amber-900 dark:text-amber-200 shadow-sm'
                                                        : 'border-gray-200 dark:border-dark-700 hover:border-amber-300 dark:hover:border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-400/8 text-gray-500 dark:text-dark-400'
                                                }`}>
                                                {regularClassId === cls.id && <span className="text-amber-600 dark:text-amber-400 text-base leading-none">✓</span>}
                                                {cls.name}
                                            </button>
                                        ))}
                                    </div>
                                    {regularClassId && regularClass && (
                                        <div className="mt-3 space-y-3">
                                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-400/8 border border-amber-200 dark:border-amber-400/20 space-y-2">
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"/>
                                                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Monthly Fee (PKR)</p>
                                                </div>
                                                <input type="number" min="0" placeholder="0"
                                                    value={formik.values.monthlyFee}
                                                    onChange={e => formik.setFieldValue('monthlyFee', e.target.value)}
                                                    onBlur={() => formik.setFieldTouched('monthlyFee', true)}
                                                    className="w-full rounded-lg border border-amber-200 dark:border-amber-400/30 bg-white dark:bg-dark-900 px-3 py-2 text-sm font-medium text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"/>
                                            </div>
                                            {renderSubjectPanel(regularClassSubjects, regularSubjectEnrollments,
                                                toggleRegularSubject, updateRegularSubjectField,
                                                () => setRegularSubjectEnrollments(regularClassSubjects.map(s => ({subjectId: s.id}))),
                                                () => setRegularSubjectEnrollments([]), 'amber', false)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No class warning */}
                    {!regularClassId && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400">Select a class.</p>
                    )}

                    {/* Enrollment summary */}
                    {regularClassId && (
                        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-gray-50 dark:bg-dark-850 border border-gray-200 dark:border-dark-700">
                            <span className="text-[11px] text-gray-400 dark:text-dark-500 font-medium self-center">Enrolled in:</span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-1 bg-amber-100 dark:bg-amber-400/15 text-amber-800 dark:text-amber-300">
                                <Sun className="h-3 w-3"/>
                                {regularClass?.name}
                                {selectedRegularSubjectIds.length > 0 && <span className="opacity-70">· {selectedRegularSubjectIds.length} subj</span>}
                                {formik.values.monthlyFee && <span className="opacity-70">· PKR {Number(formik.values.monthlyFee).toLocaleString()}/mo</span>}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )

    const securityTab = (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
                label="Recovery Email"
                name="email"
                type="email"
                icon={<Mail className="h-4 w-4"/>}
                value={formik.values.email}
                error={formik.touched.email && formik.errors.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="student@example.com"
            />
            <FormField
                label={isEditing ? "Password (optional - to reset)" : "Password (optional)"}
                name="password"
                type="password"
                icon={<Lock className="h-4 w-4"/>}
                placeholder={isEditing ? "Leave empty to keep current password" : "Leave empty to use roll number as password"}
                value={formik.values.password}
                error={formik.touched.password && formik.errors.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
            />
        </div>
    )

    const expensesTab = (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-gray-400 dark:text-dark-500">
                    One-time charges included in the selected month's challan
                </p>
                <button
                    type="button"
                    onClick={addExpense}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 border border-primary-200 dark:border-primary-400/30 rounded-lg px-3 py-1.5 hover:bg-primary-50 dark:hover:bg-primary-400/8 transition-colors"
                >
                    <Plus className="h-3.5 w-3.5"/>
                    Add Expense
                </button>
            </div>

            {expenses.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-dark-500 text-center py-8 rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
                    No additional expenses. Click "Add Expense" to add one.
                </p>
            ) : (
                <div className="space-y-3">
                    {expenses.map((exp) => (
                        <div
                            key={exp._key}
                            className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-end p-3 rounded-lg bg-gray-50 dark:bg-dark-850 border border-gray-200 dark:border-dark-700"
                        >
                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide mb-1">Type</label>
                                <select
                                    value={exp.type}
                                    onChange={e => updateExpenseField(exp._key, 'type', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm text-gray-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                                >
                                    {EXPENSE_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide mb-1">Amount (PKR)</label>
                                <input
                                    type="number" min="0" placeholder="0"
                                    value={exp.amount}
                                    onChange={e => updateExpenseField(exp._key, 'amount', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm text-gray-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide mb-1">Month</label>
                                <select
                                    value={exp.month}
                                    onChange={e => updateExpenseField(exp._key, 'month', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm text-gray-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                                >
                                    {MONTH_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-gray-400 dark:text-dark-500 uppercase tracking-wide mb-1">Year</label>
                                <select
                                    value={exp.year}
                                    onChange={e => updateExpenseField(exp._key, 'year', e.target.value)}
                                    className="w-full rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 px-2.5 py-1.5 text-sm text-gray-800 dark:text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30"
                                >
                                    {YEAR_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() => removeExpense(exp._key)}
                                className="col-span-full lg:col-span-1 flex items-center justify-end gap-1.5 p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10 rounded-lg transition-colors text-xs"
                            >
                                <Trash2 className="h-4 w-4"/>
                                <span className="lg:hidden">Remove</span>
                            </button>
                        </div>
                    ))}

                    <div className="flex justify-end pt-1">
                        <span className="text-xs text-gray-400 dark:text-dark-500">
                            Total: PKR {expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )

    const documentsTab = isEditing ? (
        <StudentDocuments studentId={id}/>
    ) : (
        <p className="text-sm text-gray-400 dark:text-dark-500 text-center py-8 rounded-lg border border-dashed border-gray-200 dark:border-dark-700">
            Save the student first, then come back here to upload documents.
        </p>
    )

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <DashboardLayout title={isEditing ? 'Edit Student' : 'Add Student'}>
            <div className="max-w-6xl mx-auto space-y-5 pb-10">

                {/* Back nav */}
                <button
                    onClick={() => navigate({
                        pathname: '/students',
                        search: searchParams.toString()
                    })}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-dark-400 hover:text-gray-800 dark:hover:text-dark-100 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Back to Students
                </button>

                <div className="bg-white dark:bg-dark-900 rounded-xl border border-gray-200 dark:border-dark-700 shadow-sm overflow-hidden">

                    {/* Page header */}
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-dark-800">
                        <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-50">
                            {isEditing ? 'Edit Student' : 'Add New Student'}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-dark-400 mt-0.5">
                            {isEditing
                                ? 'Update student information and class enrollments'
                                : 'Fill in the details to enroll a new student'}
                        </p>
                    </div>

                    <form onSubmit={formik.handleSubmit}>
                        <ServerError message={serverError} onDismiss={clearServerError}/>

                        {/* Tabs */}
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
                                <Tab label="Security" icon={<Lock className="h-3.5 w-3.5"/>}>
                                    {securityTab}
                                </Tab>
                                <Tab label="Enrollment" icon={<GraduationCap className="h-3.5 w-3.5"/>}>
                                    {enrollmentTab}
                                </Tab>
                                <Tab label="Expenses" icon={<CreditCard className="h-3.5 w-3.5"/>}>
                                    {expensesTab}
                                </Tab>
                                <Tab label="Documents" icon={<FileText className="h-3.5 w-3.5"/>}>
                                    {documentsTab}
                                </Tab>
                            </Tabs>
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-800 flex items-center justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate({
                                    pathname: '/students',
                                    search: searchParams.toString()
                                })}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                                {isEditing ? 'Update Student' : 'Create Student'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    )
}
