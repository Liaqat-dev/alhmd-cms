import {useEffect, useState} from 'react'
import {useNavigate, useParams, useSearchParams} from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {classesAPI, studentsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import UserAvatar from '@/components/shared/UserAvatar'
import {Button} from '@/components/ui/button'
import {
    ArrowLeft, BookOpen, Building2, Calendar, CreditCard, GraduationCap,
    Hash, Loader2, Mail, MapPin, Phone, Sun, User,
} from 'lucide-react'

function InfoItem({icon: Icon, label, value}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-800 shrink-0">
                <Icon className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-500">{label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-dark-100 mt-0.5 break-words">{value || '—'}</p>
            </div>
        </div>
    )
}

function Section({title, children}) {
    return (
        <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-dark-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-dark-200">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    )
}

function ClassBadge({name}) {
    return (
        <span className="inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300">
            <Sun className="h-3 w-3"/>
            {name}
        </span>
    )
}

function StatusBadge({status}) {
    const isEnrolled = status === 'ENROLLED'
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
            isEnrolled
                ? 'bg-emerald-50 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 ring-emerald-600/10 dark:ring-emerald-400/20'
                : 'bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-amber-600/10 dark:ring-amber-400/20'
        }`}>
            {isEnrolled ? 'Enrolled' : 'Pending'}
        </span>
    )
}

export default function AdminStudentProfile() {
    const {id} = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const {toast} = useToast()
    const [student, setStudent] = useState(null)
    const [classMap, setClassMap] = useState({})   // classId → {name}
    const [subjectMap, setSubjectMap] = useState({}) // subjectId → name
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const [studentRes, classesRes] = await Promise.all([
                    studentsAPI.getById(id),
                    classesAPI.getAllBatches(),
                ])
                setStudent(studentRes.data.student)

                const classes = classesRes.data.classes || []
                const cm = {}, sm = {}
                classes.forEach(cls => {
                    cm[cls.id] = {name: cls.name}
                    ;(cls.subjects || []).forEach(s => { sm[s.id] = s.name })
                })
                setClassMap(cm)
                setSubjectMap(sm)
            } catch {
                toast({variant: 'destructive', title: 'Error', description: 'Failed to load student'})
                navigate({
                    pathname: '/students',
                    search: searchParams.toString()
                })
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) {
        return (
            <DashboardLayout title="Student Profile">
                <div className="flex items-center justify-center min-h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500"/>
                </div>
            </DashboardLayout>
        )
    }

    if (!student) return null

    const dob = student.dateOfBirth
        ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
        : null
    const joined = student.joiningDate
        ? new Date(student.joiningDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
        : null

    // Enrollment — resolve name from map since the API only returns the ID
    const morningRegularName = student.morningRegularClassId ? classMap[student.morningRegularClassId]?.name : null

    const hasEnrollments = !!morningRegularName

    return (
        <DashboardLayout title="Student Profile">
            <div className="max-w-3xl mx-auto space-y-5 pb-10">

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

                {/* Header card */}
                <div className="card overflow-hidden">
                    <div className="h-16 bg-gradient-to-r from-violet-500/20 via-violet-400/10 to-transparent"/>
                    <div className="px-6 pb-6 -mt-8 flex flex-col xs:flex-row items-start xs:items-end gap-4">
                        <UserAvatar
                            name={student.name}
                            profilePicUrl={student.profilePicUrl}
                            size="xl"
                            shape="rounded"
                        />
                        <div className="flex-1 min-w-0 pb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-50 truncate">{student.name}</h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-gray-500 dark:text-dark-400 bg-gray-100 dark:bg-dark-800 px-2 py-0.5 rounded">
                                    <Hash className="h-3 w-3"/>
                                    {student.rollNumber || '—'}
                                </span>
                                <StatusBadge status={student.status}/>
                                {morningRegularName && <ClassBadge name={morningRegularName}/>}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => navigate(`/students/edit/${id}`)}
                        >
                            Edit
                        </Button>
                    </div>
                </div>

                {/* Personal info */}
                <Section title="Personal Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InfoItem icon={User}        label="Full Name"      value={student.name}/>
                        <InfoItem icon={User}        label="Father's Name"  value={student.fatherName}/>
                        <InfoItem icon={Mail}        label="Recovery Email" value={student.email}/>
                        <InfoItem icon={Calendar}    label="Date of Birth"  value={dob}/>
                        <InfoItem icon={User}        label="Gender"         value={student.gender ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase() : null}/>
                        <InfoItem icon={CreditCard}  label="CNIC"           value={student.cnic}/>
                        <InfoItem icon={Phone}       label="Phone"          value={student.phone}/>
                        <InfoItem icon={Phone}       label="Guardian Phone" value={student.guardianPhone}/>
                        <InfoItem icon={Building2}   label="School"         value={student.schoolName}/>
                        <div className="sm:col-span-2">
                            <InfoItem icon={MapPin} label="Address" value={student.address}/>
                        </div>
                    </div>
                </Section>

                {/* Academic settings */}
                <Section title="Academic Details">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InfoItem icon={Hash}          label="Roll Number"      value={student.rollNumber}/>
                        <InfoItem icon={Calendar}      label="Joining Date"     value={joined}/>
                        <InfoItem icon={GraduationCap} label="Academic Year"    value={student.academicYear}/>
                        <InfoItem icon={GraduationCap} label="Status"           value={student.status ? (student.status === 'ENROLLED' ? 'Enrolled' : 'Pending') : null}/>
                        <InfoItem icon={CreditCard}    label="Monthly Fee"      value={student.monthlyFee != null ? `PKR ${Number(student.monthlyFee).toLocaleString()}` : null}/>
                        <InfoItem icon={CreditCard}    label="Registration Fee" value={student.registrationFee != null ? `PKR ${Number(student.registrationFee).toLocaleString()}` : null}/>
                    </div>
                </Section>

                {/* Enrollments */}
                {hasEnrollments && (
                    <Section title="Class Enrollments">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sun className="h-3.5 w-3.5 text-amber-500"/>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Classes</span>
                                </div>
                                <div className="space-y-2">
                                    {morningRegularName && (
                                        <div className="rounded-lg border border-amber-200 dark:border-amber-400/25 overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-400/8">
                                                <BookOpen className="h-3.5 w-3.5 text-amber-500"/>
                                                <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{morningRegularName}</span>
                                            </div>
                                            {(student.morningRegularSubjectEnrollments || []).length > 0 && (
                                                <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
                                                    {student.morningRegularSubjectEnrollments.map(se => (
                                                        <span key={se.subjectId} className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-400/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/20 rounded-md px-2 py-0.5">
                                                            <BookOpen className="h-3 w-3"/>
                                                            {subjectMap[se.subjectId] || se.subjectId}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

            </div>
        </DashboardLayout>
    )
}
