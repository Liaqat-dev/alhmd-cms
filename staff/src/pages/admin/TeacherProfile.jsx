import {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {teachersAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import UserAvatar from '@/components/shared/UserAvatar'
import {Button} from '@/components/ui/button'
import {
    ArrowLeft, Award, Banknote, BookOpen, Building2, Calendar,
    GraduationCap, Loader2, Mail, MapPin, Phone, Sun, User, Users,
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

const TIER_LABELS = {
    TIER_1: 'Tier 1 (Senior)',
    TIER_2A: 'Tier 2A',
    TIER_2B: 'Tier 2B',
    TIER_3: 'Tier 3 (Junior)',
}


export default function AdminTeacherProfile() {
    const {id} = useParams()
    const navigate = useNavigate()
    const {toast} = useToast()
    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTeacher()
    }, [id])

    const fetchTeacher = async () => {
        try {
            const res = await teachersAPI.getById(id)
            setTeacher(res.data.teacher)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to load teacher'})
            navigate('/admin/teachers')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <DashboardLayout title="Teacher Profile">
                <div className="flex items-center justify-center min-h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-500"/>
                </div>
            </DashboardLayout>
        )
    }

    if (!teacher) return null

    const joined = teacher.joiningDate
        ? new Date(teacher.joiningDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
        : null

    // Build class assignment map: classId → {className, subjects[]}
    const assignmentMap = {}
    ;(teacher.teacherSubjects || []).forEach(ts => {
        const classId = ts.subject?.classId
        const className = ts.subject?.class?.name || `Class ${classId}`
        const key = classId
        if (!assignmentMap[key]) {
            assignmentMap[key] = {className, subjects: []}
        }
        if (ts.subject?.name) {
            assignmentMap[key].subjects.push(ts.subject.name)
        }
    })

    // Also use teacher.classes if teacherSubjects not available
    const classesFromRelation = teacher.classes || []
    if (Object.keys(assignmentMap).length === 0 && classesFromRelation.length > 0) {
        classesFromRelation.forEach(tc => {
            const key = tc.class?.id
            if (!assignmentMap[key]) {
                assignmentMap[key] = {className: tc.class?.name, subjects: []}
            }
        })
    }

    const morningAssignments = Object.values(assignmentMap)
    const hasAssignments = morningAssignments.length > 0

    const hasSalary = teacher.basicSalary != null || teacher.additionalPay != null

    const qualifications = [...(teacher.qualifications || [])].sort((a, b) => {
        const endDiff = (b.endYear || 0) - (a.endYear || 0)
        return endDiff !== 0 ? endDiff : (b.startYear || 0) - (a.startYear || 0)
    })
    const hasQualifications = qualifications.length > 0

    const formatPKR = (val) => val != null ? `PKR ${Number(val).toLocaleString()}` : null

    return (
        <DashboardLayout title="Teacher Profile">
            <div className="max-w-3xl mx-auto space-y-5 pb-10">

                {/* Back nav */}
                <button
                    onClick={() => navigate('/admin/teachers')}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-dark-400 hover:text-gray-800 dark:hover:text-dark-100 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4"/>
                    Back to Teachers
                </button>

                {/* Header card */}
                <div className="card overflow-hidden">
                    <div className="h-16 bg-gradient-to-r from-violet-500/20 via-violet-400/10 to-transparent"/>
                    <div className="px-6 pb-6 -mt-8 flex flex-col xs:flex-row items-start xs:items-end gap-4">
                        <UserAvatar
                            name={teacher.name}
                            profilePicUrl={teacher.user?.profilePicUrl}
                            size="xl"
                            shape="rounded"
                        />
                        <div className="flex-1 min-w-0 pb-1">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-dark-50 truncate">{teacher.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-dark-400 mt-0.5">{teacher.user?.email}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {teacher.tier && (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-violet-50 dark:bg-violet-400/15 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-400/20 rounded-full px-2.5 py-0.5">
                                        <Award className="h-3 w-3"/>
                                        {TIER_LABELS[teacher.tier] || teacher.tier.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0"
                            onClick={() => navigate(`/admin/teachers/edit/${id}`)}
                        >
                            Edit
                        </Button>
                    </div>
                </div>

                {/* Personal info */}
                <Section title="Personal Information">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <InfoItem icon={User}     label="Full Name"    value={teacher.name}/>
                        <InfoItem icon={Mail}     label="Email"        value={teacher.user?.email}/>
                        <InfoItem icon={Phone}    label="Phone"        value={teacher.phone}/>
                        <InfoItem icon={Calendar} label="Joining Date" value={joined}/>
                        <InfoItem icon={Award}    label="Tier"         value={TIER_LABELS[teacher.tier] || teacher.tier}/>
                        <div className="sm:col-span-2">
                            <InfoItem icon={MapPin} label="Address" value={teacher.address}/>
                        </div>
                    </div>
                </Section>

                {/* Salary */}
                {hasSalary && (
                    <Section title="Salary Information">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <InfoItem icon={Banknote} label="Basic Salary"   value={formatPKR(teacher.basicSalary)}/>
                            <InfoItem icon={Banknote} label="Additional Pay" value={formatPKR(teacher.additionalPay)}/>
                        </div>
                    </Section>
                )}

                {/* Class assignments */}
                {hasAssignments && (
                    <Section title="Class Assignments">
                        <div className="space-y-3">
                            {morningAssignments.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sun className="h-3.5 w-3.5 text-amber-500"/>
                                        <span className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Classes</span>
                                    </div>
                                    <div className="space-y-2">
                                        {morningAssignments.map((a, i) => (
                                            <div key={i} className="rounded-lg border border-amber-200 dark:border-amber-400/25 overflow-hidden">
                                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-400/8">
                                                    <Users className="h-3.5 w-3.5 text-amber-500"/>
                                                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{a.className}</span>
                                                </div>
                                                {a.subjects.length > 0 && (
                                                    <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
                                                        {a.subjects.map((s, j) => (
                                                            <span key={j} className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 rounded-md px-2 py-0.5">
                                                                <BookOpen className="h-3 w-3"/>
                                                                {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {/* Qualifications */}
                {hasQualifications && (
                    <Section title="Qualifications">
                        <div className="relative pl-7">
                            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-300 dark:from-indigo-400/40 via-gray-200 dark:via-dark-700 to-transparent"/>
                            <div className="space-y-3">
                                {qualifications.map((q, i) => (
                                    <div key={q.id} className="relative">
                                        <span className={`absolute -left-7 top-4 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-dark-900 ${
                                            i === 0 ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-dark-600'
                                        }`}/>
                                        <div className="rounded-lg border border-gray-200 dark:border-dark-700 p-3.5">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-dark-100 flex items-center gap-1.5">
                                                        <GraduationCap className="h-3.5 w-3.5 text-indigo-500 shrink-0"/>
                                                        {q.degreeTitle}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-dark-400 flex items-center gap-1.5 mt-1">
                                                        <Building2 className="h-3 w-3 shrink-0"/>
                                                        {q.institute || '—'}
                                                    </p>
                                                </div>
                                                <span className="text-xs font-medium text-gray-500 dark:text-dark-400 bg-gray-50 dark:bg-dark-850 border border-gray-200 dark:border-dark-700 rounded-full px-2.5 py-0.5 shrink-0">
                                                    {q.startYear}–{q.endYear}
                                                </span>
                                            </div>
                                            {(q.totalMarksOrGpa || q.obtainedMarksOrGpa) && (
                                                <p className="text-xs text-gray-400 dark:text-dark-500 mt-2">
                                                    Score: <span className="text-gray-600 dark:text-dark-300 font-medium">{q.obtainedMarksOrGpa || '—'}</span> / {q.totalMarksOrGpa || '—'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Section>
                )}

            </div>
        </DashboardLayout>
    )
}
