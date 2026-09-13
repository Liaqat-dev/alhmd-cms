import {useEffect, useRef, useState} from 'react'
import {useNavigate, useSearchParams} from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Table, TableBody, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {studentsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {GraduationCap, Search} from 'lucide-react'
import {useClasses} from '@/hooks/useClasses'
import {ActionButtons, PagePanel, TableEmpty, TablePagination, TableSpinner} from '@/components/shared/admin-table'
import UserAvatar from '@/components/shared/UserAvatar'

const currentYear = new Date().getFullYear()

export default function AdminStudents() {
    const {classes} = useClasses()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const [students, setStudents] = useState([])
    const [totalStudents, setTotalStudents] = useState(0)
    const [loading, setLoading] = useState(true)

    // Filters from URL
    const filterClass = searchParams.get('classId') || 'all'
    const filterStatus = searchParams.get('status') || 'all'
    const filterAcademicYear = searchParams.get('academicYear') || 'all'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const urlSearch = searchParams.get('search') || ''

    // Local state for search input to allow debouncing
    const [search, setSearch] = useState(urlSearch)

    const PAGE_SIZE = 10
    const {toast} = useToast()
    const mountedRef = useRef(false)

    useEffect(() => {
        fetchStudents()
    }, [searchParams]) // Fetch whenever URL params change

    const fetchStudents = async () => {
        setLoading(true)
        try {
            const params = {page, limit: PAGE_SIZE}
            if (urlSearch) params.search = urlSearch
            if (filterClass && filterClass !== 'all') params.classId = filterClass
            if (filterStatus && filterStatus !== 'all') params.status = filterStatus
            if (filterAcademicYear && filterAcademicYear !== 'all') params.academicYear = filterAcademicYear
            const response = await studentsAPI.getAll(params)
            setStudents(response.data.students)
            setTotalStudents(response.data.total || 0)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch students'})
        } finally {
            setLoading(false)
        }
    }

    // Debounce search input and update URL
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== urlSearch) {
                updateFilters({search, page: 1})
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [search])

    // Update local search when URL changes (e.g. browser back button)
    useEffect(() => {
        setSearch(urlSearch)
    }, [urlSearch])

    const updateFilters = (updates) => {
        const newParams = new URLSearchParams(searchParams)
        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== 'all') {
                newParams.set(key, value)
            } else {
                newParams.delete(key)
            }
        })
        // Reset page to 1 if any filter (except page) changes
        if (!updates.page) {
            newParams.delete('page')
        }
        setSearchParams(newParams)
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return
        try {
            await studentsAPI.delete(id)
            toast({title: 'Success', description: 'Student deleted successfully'})
            fetchStudents()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete student',
            })
        }
    }

    return (
        <DashboardLayout title="Student Management">
            <div className="space-y-6">
                <PagePanel
                    icon={GraduationCap}
                    title="Students"
                    count={totalStudents}
                    countLabel="total students"
                    addLabel="Add Student"
                    onAdd={() => navigate({
                        pathname: '/admin/students/add',
                        search: searchParams.toString()
                    })}
                >
                    {/* Filters */}
                    <div className="w-full flex flex-row justify-between mb-6 gap-3 flex-wrap">
                        <div className="flex flex-wrap gap-3">
                            <Select
                                value={filterClass}
                                onValueChange={(val) => updateFilters({classId: val})}
                            >
                                <SelectTrigger className="w-full  xs:w-35">
                                    <SelectValue placeholder="All Classes"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterStatus}
                                onValueChange={(val) => updateFilters({status: val})}
                            >
                                <SelectTrigger className="w-full  xs:w-35">
                                    <SelectValue placeholder="All Status"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filterAcademicYear}
                                onValueChange={(val) => updateFilters({academicYear: val})}
                            >
                                <SelectTrigger className="w-full  xs:w-35">
                                    <SelectValue placeholder="All Years"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Years</SelectItem>
                                    {Array.from({length: 5}, (_, i) => {
                                        const year = currentYear - 4 + i
                                        const label = `${year}-${year + 2}`
                                        return <SelectItem key={label} value={label}>{label}</SelectItem>
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full  xs:w-35 relative">
                            <Search
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-500 pointer-events-none"/>
                            <Input
                                placeholder="Name or roll number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <TableSpinner label="Loading students..."/>
                    ) : (<>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Father Name</TableHead>
                                        <TableHead>School</TableHead>
                                        <TableHead>Class</TableHead>
                                        <TableHead>Academic Year</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Phone</TableHead>
                                        {/*<TableHead>Phone</TableHead>*/}
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <td className="px-4 py-3 align-middle">
                                                <button
                                                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                                                    onClick={() => navigate({
                                                        pathname: `/admin/students/${student.id}/profile`,
                                                        search: searchParams.toString()
                                                    })}
                                                >
                                                    <UserAvatar name={student.name} profilePicUrl={student.profilePicUrl} size="sm" />
                                                    <div className="min-w-0">
                                                        <p className="font-medium whitespace-nowrap text-gray-800 dark:text-dark-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{student.name}</p>
                                                        <p className="text-xs font-mono whitespace-nowrap text-gray-400 dark:text-dark-500">{student.rollNumber}</p>
                                                    </div>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-gray-500 whitespace-nowrap dark:text-dark-400">{student.fatherName}</td>
                                            <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400 whitespace-nowrap text-sm">{student.schoolName || '-'}</td>
                                            <td className="px-4 py-3 align-middle">
                                            <span
                                                className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-400/15 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-600/10 dark:ring-violet-400/20 px-2 py-0.5 text-xs font-medium">
                                                {student.class?.name}
                                            </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <span
                                                    className="text-xs text-gray-500 dark:text-dark-400">{student.academicYear || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                                    student.status === 'ENROLLED'
                                                        ? 'bg-emerald-50 dark:bg-emerald-400/15 text-emerald-700 dark:text-emerald-300 ring-emerald-600/10 dark:ring-emerald-400/20'
                                                        : 'bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-amber-600/10 dark:ring-amber-400/20'
                                                }`}>
                                                {student.status === 'ENROLLED' ? 'Enrolled' : 'Pending'}
                                            </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">{student.guardianPhone}</td>
                                            <td className="px-4 py-3 align-middle">
                                                <ActionButtons
                                                    onEdit={() => navigate({
                                                        pathname: `/admin/students/edit/${student.id}`,
                                                        search: searchParams.toString()
                                                    })}
                                                    onDelete={() => handleDelete(student.id)}
                                                />
                                            </td>
                                        </TableRow>
                                    ))}
                                    {totalStudents === 0 && (
                                        <TableEmpty icon={GraduationCap} label="No students found" colSpan={7}/>
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                total={totalStudents}
                                page={page}
                                pageSize={PAGE_SIZE}
                                onPageChange={(p) => updateFilters({page: p})}
                            />
                        </>
                    )}
                </PagePanel>
            </div>
        </DashboardLayout>
    )
}
