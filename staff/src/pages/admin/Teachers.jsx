import {useEffect, useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {Input} from '@/components/ui/input'
import {Table, TableBody, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {teachersAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {Search, Users} from 'lucide-react'
import {ActionButtons, ClassBadge, PagePanel, TableEmpty, TablePagination, TableSpinner} from '@/components/shared/admin-table'
import UserAvatar from '@/components/shared/UserAvatar'

export default function AdminTeachers() {
    const navigate = useNavigate()
    const [teachers, setTeachers] = useState([])
    const [totalTeachers, setTotalTeachers] = useState(0)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10
    const {toast} = useToast()
    const mountedRef = useRef(false)

    const fetchTeachers = async () => {
        setLoading(true)
        try {
            const params = {page, limit: PAGE_SIZE}
            if (search) params.search = search
            const response = await teachersAPI.getAll(params)
            setTeachers(response.data.teachers)
            setTotalTeachers(response.data.total || 0)
        } catch {
            toast({variant: 'destructive', title: 'Error', description: 'Failed to fetch teachers'})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTeachers()
    }, [])

    // Debounce search
    useEffect(() => {
        setPage(1)
        const timer = setTimeout(() => fetchTeachers(), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch when page changes (skip on initial mount to avoid double fetch)
    useEffect(() => {
        if (!mountedRef.current) { mountedRef.current = true; return }
        fetchTeachers()
    }, [page])

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this teacher?')) return
        try {
            await teachersAPI.delete(id)
            toast({title: 'Success', description: 'Teacher deleted successfully'})
            fetchTeachers()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to delete teacher',
            })
        }
    }

    return (
        <DashboardLayout title="Teacher Management">
            <div className="space-y-6">
                <PagePanel
                    icon={Users}
                    title="Teachers"
                    count={totalTeachers}
                    countLabel="total teachers"
                    addLabel="Add Teacher"
                    onAdd={() => navigate('/admin/teachers/add')}
                >
                    <div className="flex justify-end">
                        <div className="bg-white w-full xs:min-w-36 xs:max-w-64 relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-dark-500 pointer-events-none"/>
                            <Input
                                placeholder="Search by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <TableSpinner label="Loading teachers..."/>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Tier</TableHead>
                                        <TableHead>Assigned Classes</TableHead>
                                        <TableHead>Joining Date</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teachers.map((teacher) => (
                                        <TableRow key={teacher.id}>
                                            <td className="px-4 py-3 align-middle">
                                                <button
                                                    className="flex items-center gap-2.5 text-left hover:opacity-80 transition-opacity"
                                                    onClick={() => navigate(`/admin/teachers/${teacher.id}/profile`)}
                                                >
                                                    <UserAvatar name={teacher.name} profilePicUrl={teacher.user?.profilePicUrl} size="sm" />
                                                    <span className="font-medium whitespace-nowrap text-gray-800 dark:text-dark-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">{teacher.name}</span>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">{teacher.user?.email}</td>
                                            <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">{teacher.phone || '—'}</td>
                                            <td className="px-4 py-3 align-middle">
                                                <span className="inline-flex items-center rounded-md bg-violet-50 dark:bg-violet-400/15 text-violet-700 dark:text-violet-300 ring-1 ring-inset ring-violet-600/10 dark:ring-violet-400/20 px-2 py-0.5 text-xs font-medium">
                                                    {teacher.tier?.replace('_', ' ') || 'TIER 3'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <div className="flex flex-wrap gap-1">
                                                    {(teacher.classes || []).map(c => (
                                                        <ClassBadge key={c.class?.id} name={c.class?.name}/>
                                                    ))}
                                                    {(teacher.classes || []).length === 0 && (
                                                        <span className="text-xs text-gray-400 dark:text-dark-500">No classes</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle text-gray-500 dark:text-dark-400">
                                                {teacher.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                                <ActionButtons
                                                    onEdit={() => navigate(`/admin/teachers/edit/${teacher.id}`)}
                                                    onDelete={() => handleDelete(teacher.id)}
                                                />
                                            </td>
                                        </TableRow>
                                    ))}
                                    {totalTeachers === 0 && (
                                        <TableEmpty icon={Users} label="No teachers found" colSpan={7}/>
                                    )}
                                </TableBody>
                            </Table>
                            <TablePagination
                                total={totalTeachers}
                                page={page}
                                pageSize={PAGE_SIZE}
                                onPageChange={setPage}
                            />
                        </>
                    )}
                </PagePanel>
            </div>
        </DashboardLayout>
    )
}
